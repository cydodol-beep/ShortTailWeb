import React from 'react';
import { Customer, Order } from '../types';
import { formatRupiah, formatDisplayPhone, maskPhoneNumber, maskAddress } from '../lib/utils';
import { CheckCircle2, MessageSquare, ShoppingBag, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  order: Order | null;
  customer: Customer;
  cartSummary: { name: string; quantity: number; price: number }[];
  onClose: () => void;
  adminWhatsappPhone?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  order,
  customer,
  cartSummary,
  onClose,
  adminWhatsappPhone = '6287888177362', // Store admin phone number
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  // Prepare exact WhatsApp message required by prompt
  const baseWaText = `Halo kak, saya sudah pesen melalui web ya. tolong dibantu cek`;
  const detailedWaText = `${baseWaText}

*Detail Pesanan:*
• Kode Order: ${order.custom_order_id || order.id}
• Nama: ${customer.name}
• No. HP: ${customer.phone}
• Total: ${formatRupiah(order.total_amount)}
• Sumber: WebStore

Mohon konfirmasi pesanan saya. Terima kasih!`;

  const whatsappUrl = `https://wa.me/${adminWhatsappPhone}?text=${encodeURIComponent(detailedWaText)}`;

  const handleCopyOrderCode = () => {
    if (order.custom_order_id) {
      navigator.clipboard.writeText(order.custom_order_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative"
        >
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 text-white">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Pesanan Berhasil Disimpan!</h2>
            <p className="text-emerald-100 text-xs mt-1">
              Terima kasih telah berbelanja di ShortTail Web Store
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Order ID Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Nomor Kode Pesanan
                </span>
                <span className="text-sm font-extrabold text-slate-900 font-mono">
                  {order.custom_order_id || order.id}
                </span>
              </div>
              <button
                onClick={handleCopyOrderCode}
                className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tercopy' : 'Copy'}</span>
              </button>
            </div>

            {/* Items Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ringkasan Produk Dipesan
              </h4>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                {cartSummary.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="font-medium text-slate-900 truncate max-w-[220px]">
                      {item.name} <span className="text-slate-400">x{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Pembayaran</span>
                  <span className="text-emerald-700">{formatRupiah(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <div className="font-bold text-slate-800 mb-1">Informasi Pemesan:</div>
              <div><span className="text-slate-400">Nama:</span> {customer.name}</div>
              <div><span className="text-slate-400">No. HP:</span> <span className="font-mono">{maskPhoneNumber(customer.phone)}</span></div>
              <div><span className="text-slate-400">Alamat:</span> {maskAddress(customer.address)}, {customer.city}</div>
              <div><span className="text-slate-400">Sumber:</span> <span className="text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">WebStore</span></div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            {/* WhatsApp Admin Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-white/20" />
              <span>Hubungi Admin via Whatsapp</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-600 font-semibold rounded-2xl text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Tutup & Belanja Lagi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
