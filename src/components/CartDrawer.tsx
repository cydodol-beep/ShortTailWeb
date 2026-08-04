import React, { useState } from 'react';
import { CartItem, Customer } from '../types';
import { formatRupiah, formatDisplayPhone } from '../lib/utils';
import { X, Trash2, Plus, Minus, ShoppingBag, MapPin, User, ArrowRight, FileText, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onCheckout: (notes: string) => Promise<void>;
  submitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  customer,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  submitting,
}) => {
  const [orderNotes, setOrderNotes] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => {
    const itemPrice = item.selectedVariant
      ? Number(item.selectedVariant.price_adjustment)
      : Number(item.product.base_price);
    return sum + itemPrice * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;
    await onCheckout(orderNotes);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl relative"
        >
          {/* Cart Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Keranjang Belanja</h2>
                <p className="text-xs text-slate-500">{totalItems} Item Dipilih</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-base">Keranjang Anda Kosong</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Silakan pilih produk favorit Anda di katalog untuk menambahkannya ke keranjang.
                </p>
              </div>
            ) : (
              <>
                {/* Items loop */}
                <div className="space-y-3">
                  {cart.map((item) => {
                    const itemPrice = item.selectedVariant
                      ? Number(item.selectedVariant.price_adjustment)
                      : Number(item.product.base_price);
                    const itemImg = item.selectedVariant?.variant_image_url || item.product.main_image_url;
                    const maxStock = item.selectedVariant
                      ? Number(item.selectedVariant.stock_quantity)
                      : Number(item.product.stock_quantity);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden p-1">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.product.name}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-slate-300" />
                          )}
                        </div>

                        {/* Product details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedVariant && (
                            <div className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                              Varian: {item.selectedVariant.variant_name}
                            </div>
                          )}
                          <div className="text-xs font-semibold text-slate-900 mt-0.5">
                            {formatRupiah(itemPrice)}
                          </div>
                        </div>

                        {/* Qty Controls */}
                        <div className="flex items-center space-x-1.5 shrink-0 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            disabled={item.quantity >= maxStock}
                            className="w-6 h-6 text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Customer Shipping Address Preview */}
                <div className="pt-4 space-y-3">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Data Pemesan</span>
                      </span>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        Terverifikasi
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 bg-white p-2.5 rounded-xl border border-emerald-100">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="text-slate-600">{formatDisplayPhone(customer.phone)}</div>
                      <div className="text-slate-500 text-[11px] flex items-start space-x-1 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          {customer.address}, {customer.city}, {customer.province} {customer.postcode || ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Catatan Pesanan (Opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Contoh: Titip di satpam, bungkus rapi ya kak..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cart Footer / Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} item)</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sumber Pesanan</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                    WebStore
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="text-emerald-700">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleProcessCheckout}
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses Pesanan...</span>
                  </>
                ) : (
                  <>
                    <span>Proses Checkout Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
