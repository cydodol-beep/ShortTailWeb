/**
 * ShortTail Web Store - Customer Self-Service Ordering App
 * Integrated with Supabase POS Database
 */

import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Customer, Product, ProductVariant, Category, CartItem, Order } from './types';
import { generateCustomOrderId, isProductActive } from './lib/utils';
import { CustomerValidation } from './components/CustomerValidation';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { GeminiPromptModal } from './components/GeminiPromptModal';
import { WhatsAppChatModal } from './components/WhatsAppChatModal';
import { Package, RefreshCw, ShoppingBag, Sparkles, Store, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // Active Customer State
  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('shorttail_active_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('ShortTail Web Store');
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Filter States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shorttail_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [lastCartSummary, setLastCartSummary] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // WhatsApp Chat Modal States
  const [isWhatsAppChatOpen, setIsWhatsAppChatOpen] = useState(false);
  const [whatsAppInitialProduct, setWhatsAppInitialProduct] = useState<Product | null>(null);
  const [whatsAppInitialText, setWhatsAppInitialText] = useState<string>('');

  const handleOpenWhatsAppChat = (product?: Product | null, initialText?: string) => {
    setWhatsAppInitialProduct(product || null);
    setWhatsAppInitialText(initialText || '');
    setIsWhatsAppChatOpen(true);
  };

  // URL Deep Link check for ?product=ID or ?product_id=ID
  useEffect(() => {
    if (products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetProdId = urlParams.get('product') || urlParams.get('product_id') || urlParams.get('item');
      if (targetProdId) {
        const found = products.find((p) => String(p.id) === String(targetProdId));
        if (found) {
          setDetailProduct(found);
        }
      }
    }
  }, [products]);

  // Save customer to localStorage
  useEffect(() => {
    if (customer) {
      localStorage.setItem('shorttail_active_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('shorttail_active_customer');
    }
  }, [customer]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('shorttail_cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch Categories, Products, and Product Variants from Supabase
  const fetchData = async () => {
    setLoadingData(true);
    setDataError(null);

    try {
      // 1. Fetch Categories
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) console.warn('Categories query warning:', catErr);

      // 2. Fetch Products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Fetch Product Variants
      const { data: varData, error: varErr } = await supabase
        .from('product_variants')
        .select('*');

      if (varErr) console.warn('Product variants fetch warning:', varErr);

      // 4. Fetch Store Settings for Store Logo & Name
      const { data: storeSettingsData } = await supabase
        .from('store_settings')
        .select('store_logo, store_name')
        .limit(1)
        .maybeSingle();

      if (storeSettingsData?.store_logo) {
        setStoreLogo(storeSettingsData.store_logo);
      }
      if (storeSettingsData?.store_name) {
        setStoreName(storeSettingsData.store_name);
      }

      if (prodErr) {
        console.error('Error fetching products:', prodErr);
        setDataError('Gagal mengambil data produk dari Supabase.');
      } else {
        const rawProducts = (prodData as Product[]) || [];
        const rawVariants = (varData as ProductVariant[]) || [];

        const formattedProducts = rawProducts
          .filter(isProductActive)
          .map((p) => {
            const pVars = rawVariants.filter((v) => v.product_id === p.id);
            const hasVar = Boolean(p.has_variants || pVars.length > 0);
            return {
              ...p,
              has_variants: hasVar,
              variants: pVars,
            };
          });

        setProducts(formattedProducts);
      }

      // Format categories or derive if empty
      if (catData && catData.length > 0) {
        setCategories(catData as Category[]);
      } else if (prodData && prodData.length > 0) {
        const uniqueCatNames = Array.from(
          new Set(prodData.map((p: any) => p.category).filter(Boolean))
        );
        const derived: Category[] = uniqueCatNames.map((name, idx) => ({
          id: `derived-${idx}`,
          name: name as string,
        }));
        setCategories(derived);
      }
    } catch (err: any) {
      console.error('Fetch data exception:', err);
      setDataError('Terjadi kesalahan jaringan saat terhubung ke database.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cart Operations
  const handleAddToCart = (product: Product, selectedVariant?: ProductVariant) => {
    const cartItemId = selectedVariant
      ? `${product.id}-${selectedVariant.id}`
      : `${product.id}-base`;
    const maxStock = selectedVariant
      ? Number(selectedVariant.stock_quantity)
      : Number(product.stock_quantity);

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: Math.min(item.quantity + 1, maxStock) }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          selectedVariant,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const maxStock = item.selectedVariant
              ? Number(item.selectedVariant.stock_quantity)
              : Number(item.product.stock_quantity);
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(newQty, maxStock) } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout Submission to Supabase
  const handleCheckout = async (notes: string) => {
    if (!customer || cart.length === 0) return;

    setSubmittingOrder(true);
    try {
      const customOrderId = generateCustomOrderId();
      const subtotal = cart.reduce((sum, item) => {
        const itemPrice = item.selectedVariant
          ? Number(item.selectedVariant.price_adjustment)
          : Number(item.product.base_price);
        return sum + itemPrice * item.quantity;
      }, 0);

      const newOrderData = {
        custom_order_id: customOrderId,
        source: 'pos',
        status: 'pending',
        subtotal: subtotal,
        shipping_fee: 0,
        total_amount: subtotal,
        recipient_name: customer.name,
        recipient_phone: customer.phone,
        recipient_address: customer.address,
        recipient_province: customer.province || null,
        recipient_city: customer.city || null,
        notes: notes || null,
      };

      // 1. Insert order record
      const { data: orderResult, error: orderErr } = await supabase
        .from('orders')
        .insert([newOrderData])
        .select('*')
        .single();

      if (orderErr) {
        console.error('Checkout insert order error:', orderErr);
        alert('Gagal membuat pesanan: ' + orderErr.message);
        return;
      }

      const createdOrderObj = orderResult as Order;

      // 2. Insert order_items with variant details
      if (createdOrderObj?.id) {
        const orderItemsToInsert = cart.map((item) => ({
          order_id: createdOrderObj.id,
          product_id: item.product.id,
          variant_id: item.selectedVariant?.id || null,
          variant_name_snapshot: item.selectedVariant?.variant_name || null,
          quantity: item.quantity,
          price_at_purchase: item.selectedVariant
            ? Number(item.selectedVariant.price_adjustment)
            : Number(item.product.base_price),
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsErr) {
          console.warn('Order items insert warning:', itemsErr);
        }
      }

      // Save summary snapshot before clearing cart
      setLastCartSummary(
        cart.map((item) => {
          const price = item.selectedVariant
            ? Number(item.selectedVariant.price_adjustment)
            : Number(item.product.base_price);
          const name = item.selectedVariant
            ? `${item.product.name} (${item.selectedVariant.variant_name})`
            : item.product.name;
          return { name, quantity: item.quantity, price };
        })
      );

      // Reset cart and open Thank You modal
      setCreatedOrder(createdOrderObj);
      setCart([]);
      setIsCartOpen(false);
    } catch (err: any) {
      console.error('Checkout exception:', err);
      alert('Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    if (!isProductActive(product)) return false;

    if (selectedCategoryId) {
      const matchCatId = product.category_id === selectedCategoryId;
      const matchCatName = categories.find((c) => c.id === selectedCategoryId)?.name === product.category;
      if (!matchCatId && !matchCatName) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = product.name?.toLowerCase().includes(q);
      const matchDesc = product.description?.toLowerCase().includes(q);
      const matchCat = product.category?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!customer) {
    return (
      <>
        <CustomerValidation
          onCustomerValidated={(validatedCust) => setCustomer(validatedCust)}
          onOpenPromptModal={() => setIsPromptModalOpen(true)}
          storeLogo={storeLogo}
          storeName={storeName}
        />
        <GeminiPromptModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <div>
        {/* Navigation Bar */}
        <Navbar
          customer={customer}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => setSelectedCategoryId(id)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          cartCount={cartTotalItems}
          onOpenCart={() => setIsCartOpen(true)}
          onChangeCustomer={() => setCustomer(null)}
          onOpenWhatsAppChat={() => handleOpenWhatsAppChat()}
          storeLogo={storeLogo}
          storeName={storeName}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top Banner / Welcome Info */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-2">
              <span className="inline-block bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Selamat Belanja, {customer.name}! 👋
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pilih Produk Favorit Anda Secara Langsung
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                Pilih barang kebutuhan toko Anda, atur varian & jumlah di keranjang, dan kirimkan pesanan langsung ke sistem kami.
              </p>
            </div>

            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white pointer-events-none">
              <Store className="w-64 h-64" />
            </div>
          </div>

          {/* Catalog Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {selectedCategoryId
                  ? categories.find((c) => c.id === selectedCategoryId)?.name || 'Kategori Terpilih'
                  : 'Katalog Produk Toko'}
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan {filteredProducts.length} dari {products.length} produk
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={loadingData}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Refresh Produk</span>
            </button>
          </div>

          {/* Loading State */}
          {loadingData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse"
                >
                  <div className="bg-slate-100 aspect-square rounded-xl w-full" />
                  <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-8 bg-slate-100 rounded-xl w-full mt-2" />
                </div>
              ))}
            </div>
          ) : dataError ? (
            /* Error State */
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-3 max-w-md mx-auto my-12">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 font-bold">
                !
              </div>
              <h4 className="font-bold text-base">{dataError}</h4>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty Search Results */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 max-w-md mx-auto my-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">Tidak Ada Produk Ditemukan</h4>
              <p className="text-xs text-slate-400">
                Coba kata kunci pencarian lain atau pilih kategori yang berbeda.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredProducts.map((product) => {
                const totalQtyInCart = cart
                  .filter((item) => item.product.id === product.id)
                  .reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantityInCart={totalQtyInCart}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={(p, delta) => {
                      const defaultItemId = `${p.id}-base`;
                      handleUpdateQuantity(defaultItemId, delta);
                    }}
                    onOpenDetail={(p) => setDetailProduct(p)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Mobile Cart Bar */}
      {cartTotalItems > 0 && (
        <div className="sticky bottom-4 z-20 max-w-lg mx-auto px-4">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer border border-slate-700"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-300 font-medium">
                  {cartTotalItems} Item Dalam Keranjang
                </div>
                <div className="text-sm font-extrabold text-white">
                  Lihat Keranjang
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors">
              Checkout &rarr;
            </div>
          </motion.button>
        </div>
      )}

      {/* Floating WhatsApp Chat Action Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenWhatsAppChat()}
          className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white font-extrabold p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl flex items-center space-x-2 border border-emerald-400/40 cursor-pointer group"
          title="Chat Admin WA (Tanya Detail / Tempel Link)"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-emerald-100" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>
          <span className="text-xs sm:text-sm hidden sm:inline font-extrabold tracking-tight">
            Tanya Admin WA
          </span>
        </motion.button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ShortTail Store POS Web Order System</span>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        cart={cart}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onOpenWhatsAppChat={(p) => handleOpenWhatsAppChat(p)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        customer={customer}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
        submitting={submittingOrder}
      />

      {/* Thank You Checkout Confirmation Modal */}
      <CheckoutModal
        order={createdOrder}
        customer={customer}
        cartSummary={lastCartSummary}
        onClose={() => setCreatedOrder(null)}
      />

      {/* WhatsApp Admin Direct Inquiry Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppChatOpen}
        onClose={() => setIsWhatsAppChatOpen(false)}
        products={products}
        customer={customer}
        initialProduct={whatsAppInitialProduct}
        initialLinkOrText={whatsAppInitialText}
      />

      {/* Google Gemini Specification Prompt Modal */}
      <GeminiPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />
    </div>
  );
}
