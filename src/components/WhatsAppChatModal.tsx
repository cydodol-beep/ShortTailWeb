import React, { useState, useEffect } from 'react';
import { Product, Customer } from '../types';
import { formatRupiah, getProductPriceDisplay, formatDisplayPhone } from '../lib/utils';
import {
  X,
  MessageSquare,
  Send,
  Link2,
  Search,
  Check,
  Copy,
  Package,
  ExternalLink,
  Sparkles,
  HelpCircle,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_WA_NUMBER = '6287888177362';

interface WhatsAppChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customer: Customer | null;
  initialProduct?: Product | null;
  initialLinkOrText?: string;
}

export const WhatsAppChatModal: React.FC<WhatsAppChatModalProps> = ({
  isOpen,
  onClose,
  products,
  customer,
  initialProduct = null,
  initialLinkOrText = '',
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct);
  const [pastedInput, setPastedInput] = useState<string>(initialLinkOrText);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('Apakah produk ini ready stok?');
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setSelectedProduct(initialProduct);
        setPastedInput(`${window.location.origin}${window.location.pathname}?product=${initialProduct.id}`);
      } else if (initialLinkOrText) {
        setPastedInput(initialLinkOrText);
        parsePastedInput(initialLinkOrText);
      }
    }
  }, [isOpen, initialProduct, initialLinkOrText]);

  // Try to parse product from pasted input (URL, ID, SKU, or name)
  const parsePastedInput = (text: string) => {
    if (!text.trim()) return;

    // Check URL search params (e.g. ?product=xxx, ?product_id=xxx, ?item=xxx, ?id=xxx)
    try {
      if (text.includes('http://') || text.includes('https://') || text.includes('?')) {
        const urlObj = new URL(text.startsWith('http') ? text : `https://dummy.com/${text}`);
        const prodId =
          urlObj.searchParams.get('product') ||
          urlObj.searchParams.get('product_id') ||
          urlObj.searchParams.get('item') ||
          urlObj.searchParams.get('id');

        if (prodId) {
          const match = products.find((p) => String(p.id) === String(prodId));
          if (match) {
            setSelectedProduct(match);
            return;
          }
        }
      }
    } catch {
      // Ignore URL parse error and fall back to keyword search
    }

    // Try matching product ID, SKU, or Name in text
    const lowerText = text.toLowerCase();
    const match = products.find(
      (p) =>
        lowerText.includes(String(p.id).toLowerCase()) ||
        (p.sku && lowerText.includes(p.sku.toLowerCase())) ||
        lowerText.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(lowerText)
    );

    if (match) {
      setSelectedProduct(match);
    }
  };

  const handlePastedInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedInput(val);
    parsePastedInput(val);
  };

  // Generate WhatsApp message text
  const buildWhatsAppMessage = () => {
    const customerName = customer ? customer.name : 'Pelanggan';
    const customerPhone = customer ? customer.phone : '';

    let message = `Halo Admin ShortTail Web Store 👋\n\n`;
    message += `Saya *${customerName}* ${customerPhone ? `(${customerPhone})` : ''} mau tanya detail produk.\n\n`;

    if (selectedProduct) {
      message += `*📦 Detail Produk:* ${selectedProduct.name}\n`;
      if (selectedProduct.sku) message += `*🏷️ SKU:* ${selectedProduct.sku}\n`;
      message += `*💰 Harga:* ${getProductPriceDisplay(selectedProduct)}\n`;
      if (selectedProduct.category) message += `*📁 Kategori:* ${selectedProduct.category}\n`;
      
      const prodUrl = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
      message += `*🔗 Link Produk:* ${prodUrl}\n\n`;
    } else if (pastedInput.trim()) {
      message += `*🔗 Link/Referensi Produk yang Ditempel:* ${pastedInput.trim()}\n\n`;
    }

    const questionText = customQuestion.trim() || selectedPreset;
    message += `*💬 Pertanyaan Saya:*\n"${questionText}"\n\n`;
    message += `Mohon infonya ya admin, terima kasih! 🙏`;

    return message;
  };

  const handleSendWhatsApp = () => {
    const message = buildWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyProductLink = () => {
    if (!selectedProduct) return;
    const prodUrl = `${window.location.origin}${window.location.pathname}?product=${selectedProduct.id}`;
    navigator.clipboard.writeText(prodUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const presetQuestions = [
    'Apakah produk ini ready stok?',
    'Bisa minta real picture / foto asli produk?',
    'Berapa estimasi ongkir & pengiriman ke kota saya?',
    'Apakah ada promo/diskon khusus untuk produk ini?',
    'Bisa konsultasi ukuran/spesifikasi lebih detail?',
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/80 relative max-h-[90vh] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white flex items-center justify-between relative shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-100 border border-white/20 shadow-inner">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-1.5">
                  Chat Admin WhatsApp
                  <span className="text-[10px] bg-emerald-400/30 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300/30 font-semibold">
                    Official
                  </span>
                </h2>
                <p className="text-xs text-emerald-100/90 flex items-center gap-1">
                  <span>No. WA:</span>
                  <span className="font-mono font-bold text-white">
                    {formatDisplayPhone(ADMIN_WA_NUMBER)}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Content */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
            
            {/* Step 1: Link or Product Input */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span>Tempel Link / Pilih Produk</span>
                </span>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      setPastedInput('');
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-bold capitalize"
                  >
                    Hapus Pilihan
                  </button>
                )}
              </label>

              {/* Paste Link Input */}
              <div className="relative">
                <input
                  type="text"
                  value={pastedInput}
                  onChange={handlePastedInputChange}
                  placeholder="Tempel link produk (cth: https://.../?product=xxx) atau nama/SKU produk..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Product Picker Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">Atau pilih produk langsung dari katalog:</span>
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 flex items-center gap-1 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{isProductPickerOpen ? 'Tutup Daftar' : 'Cari Produk Store'}</span>
                </button>
              </div>

              {/* Product Picker Dropdown Grid */}
              {isProductPickerOpen && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 mt-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama produk atau SKU..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-3 text-slate-400 text-xs">
                        Tidak ada produk ditemukan
                      </div>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(p);
                            const prodUrl = `${window.location.origin}${window.location.pathname}?product=${p.id}`;
                            setPastedInput(prodUrl);
                            setIsProductPickerOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center space-x-2.5 transition-colors ${
                            selectedProduct?.id === p.id
                              ? 'bg-emerald-100/80 border border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                          }`}
                        >
                          {p.main_image_url ? (
                            <img
                              src={p.main_image_url}
                              alt={p.name}
                              className="w-8 h-8 object-contain rounded-lg bg-slate-50 border shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>{getProductPriceDisplay(p)}</span>
                              {p.sku && <span>SKU: {p.sku}</span>}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Product Card Preview */}
            {selectedProduct && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200/90 p-3.5 flex items-start justify-between gap-3 relative shadow-2xs">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-14 h-14 bg-white rounded-xl border border-emerald-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    {selectedProduct.main_image_url ? (
                      <img
                        src={selectedProduct.main_image_url}
                        alt={selectedProduct.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Package className="w-7 h-7 text-emerald-300" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                      Item Terpilih
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                      {selectedProduct.name}
                    </h4>
                    <p className="font-black text-emerald-700 text-xs sm:text-sm">
                      {getProductPriceDisplay(selectedProduct)}
                    </p>
                    {selectedProduct.sku && (
                      <p className="text-[10px] text-slate-500">
                        SKU: <span className="font-mono font-bold">{selectedProduct.sku}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyProductLink}
                  className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 p-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-2xs"
                  title="Salin Link Produk"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px]">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[10px] hidden sm:inline">Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Preset Questions */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Pilih Opsi Pertanyaan Cepat</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(q);
                      if (customQuestion === q) setCustomQuestion('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left border cursor-pointer ${
                      selectedPreset === q && !customQuestion
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Custom Question Box */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Pesan / Pertanyaan Tambahan (Opsional)</span>
              </label>
              <textarea
                rows={2}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Ketik pertanyaan khusus untuk admin di sini..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Live Message Preview Box */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Pratinjau Pesan WA:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Direct WhatsApp Link
                </span>
              </div>
              <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-300 max-h-32 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                {buildWhatsAppMessage()}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Terhubung langsung ke WhatsApp Admin
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim ke WhatsApp</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
