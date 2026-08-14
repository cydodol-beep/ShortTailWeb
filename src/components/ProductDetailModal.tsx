import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, CartItem } from '../types';
import { formatRupiah } from '../lib/utils';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Package,
  Tag,
  Weight,
  Layers,
  CheckCircle2,
  Circle,
  Sparkles,
  Info,
  MessageSquare,
  Share2,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  cart: CartItem[];
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onOpenWhatsAppChat?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  cart,
  onClose,
  onAddToCart,
  onUpdateQuantity,
  onOpenWhatsAppChat,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (product?.has_variants && product.variants && product.variants.length > 0) {
      const inStock = product.variants.find((v) => Number(v.stock_quantity) > 0);
      setSelectedVariant(inStock || product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  if (!product) return null;

  const displayPrice = selectedVariant
    ? Number(selectedVariant.price_adjustment)
    : Number(product.base_price);
  const displayStock = selectedVariant
    ? Number(selectedVariant.stock_quantity)
    : Number(product.stock_quantity);
  const displaySku = selectedVariant?.sku || product.sku;
  const displayWeight = selectedVariant?.weight_grams || product.unit_weight_grams;
  const displayImage = selectedVariant?.variant_image_url || product.main_image_url;
  const isOutOfStock = displayStock <= 0;

  // Cart item matching for the active selected variant or base product
  const cartItemId = selectedVariant
    ? `${product.id}-${selectedVariant.id}`
    : `${product.id}-base`;
  const cartItem = cart.find((item) => item.id === cartItemId);
  const currentCartQty = cartItem ? cartItem.quantity : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200/80 relative max-h-[90vh] flex flex-col justify-between"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-md border border-slate-200/60"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Top Product Header (Image + Title/Category/Specs) */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Product Image Frame */}
              <div className="w-full sm:w-48 h-48 sm:h-52 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200/70 flex items-center justify-center p-4 shrink-0 relative overflow-hidden group">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-300 stroke-[1.5]" />
                )}

                {selectedVariant && (
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-purple-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs flex items-center justify-between">
                    <span className="flex items-center space-x-1 truncate">
                      <Layers className="w-3 h-3 text-purple-300 inline shrink-0" />
                      <span className="truncate">{selectedVariant.variant_name}</span>
                    </span>
                    <span className="text-[9px] bg-purple-700/80 px-1.5 py-0.5 rounded text-purple-100 shrink-0 ml-1">
                      Aktif
                    </span>
                  </div>
                )}
              </div>

              {/* Product Title & Key Information */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  {product.category && (
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-md mb-1.5">
                      {product.category}
                    </span>
                  )}
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {product.name}
                  </h2>
                </div>

                {/* Main Price Display */}
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                    {formatRupiah(displayPrice)}
                  </span>
                  {product.has_variants && (
                    <span className="text-xs font-semibold text-slate-400">
                      / varian
                    </span>
                  )}
                </div>

                {/* Specs Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {displaySku && (
                    <div className="flex items-center space-x-1.5 bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200/60">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>SKU: {displaySku}</span>
                    </div>
                  )}

                  {displayWeight ? (
                    <div className="flex items-center space-x-1.5 bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200/60">
                      <Weight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{displayWeight} gram</span>
                    </div>
                  ) : null}

                  <div
                    className={`flex items-center space-x-1.5 font-bold px-2.5 py-1 rounded-lg border ${
                      isOutOfStock
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Stok Habis' : `Stok Tersedia: ${displayStock}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variant Selector Section */}
            {product.has_variants && product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Pilih Varian Produk
                    </h3>
                  </div>

                  {selectedVariant && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <span>Terpilih:</span>
                      <span className="text-purple-900 font-extrabold">{selectedVariant.variant_name}</span>
                    </span>
                  )}
                </div>

                {/* Variant List / Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const varOutOfStock = Number(variant.stock_quantity) <= 0;
                    const varPrice = Number(variant.price_adjustment);

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={varOutOfStock}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex items-center space-x-3 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20'
                            : varOutOfStock
                            ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Radio Icon */}
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        {/* Variant Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isSelected ? 'text-purple-950 font-black' : 'text-slate-900'
                              }`}
                            >
                              {variant.variant_name}
                            </span>
                            {varOutOfStock && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded shrink-0">
                                Habis
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="font-extrabold text-emerald-600">
                              {formatRupiah(varPrice)}
                            </span>
                            {!varOutOfStock && (
                              <span className="text-[10px] font-medium text-slate-500">
                                Stok: {variant.stock_quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description Section */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Deskripsi Produk</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                {product.description || 'Tidak ada deskripsi tambahan untuk produk ini.'}
              </p>
            </div>
          </div>

          {/* Sticky Modal Action Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Harga {selectedVariant ? `(${selectedVariant.variant_name})` : ''}
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 leading-none">
                {formatRupiah(displayPrice)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prodUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
                  navigator.clipboard.writeText(prodUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                title="Salin link produk"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>Salin Link</span>
                  </>
                )}
              </button>

              {onOpenWhatsAppChat && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenWhatsAppChat(product);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                  title="Tanyakan detail produk ini ke Admin via WhatsApp"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Tanya Admin WA</span>
                </button>
              )}

              {currentCartQty > 0 ? (
                <div className="flex items-center justify-between sm:justify-end space-x-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-1.5">
                  <div className="px-2 text-xs font-bold text-emerald-900 hidden sm:block">
                    Dalam Keranjang:
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onUpdateQuantity(cartItemId, -1)}
                      className="w-10 h-10 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs border border-emerald-200"
                      title="Kurangi Qty"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-base text-emerald-950">
                      {currentCartQty}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(cartItemId, 1)}
                      disabled={currentCartQty >= displayStock}
                      className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold transition-colors cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Tambah Qty"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(product, selectedVariant || undefined)}
                  disabled={isOutOfStock}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? 'Stok Habis'
                      : selectedVariant
                      ? `Tambah Varian ke Keranjang`
                      : 'Tambah ke Keranjang'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
