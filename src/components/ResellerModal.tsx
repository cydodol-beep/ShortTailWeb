import React, { useState, useEffect } from 'react';
import { Customer, ResellerRegistration, ResellerType } from '../types';
import { supabase } from '../lib/supabase';
import {
  X,
  Send,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  HelpCircle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_EMAIL = 'shorttail.id@gmail.com';
const ADMIN_WA_NUMBER = '6287888177362';

interface ResellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export const ResellerModal: React.FC<ResellerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    province: string;
    reseller_type: ResellerType;
    business_name: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    reseller_type: 'shorttail_brand',
    business_name: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill from active customer if available
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setErrorMessage('');
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          name: customer.name || prev.name,
          phone: customer.phone || prev.phone,
          address: customer.address || prev.address,
          city: customer.city || prev.city,
          province: customer.province || prev.province,
        }));
      }
    }
  }, [isOpen, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Alamat email valid wajib diisi.');
      return;
    }

    setLoading(true);

    const resellerTypeName =
      formData.reseller_type === 'shorttail_brand'
        ? 'ShortTail.id Brand'
        : 'White Label (Brand Sendiri)';

    const registrationData: ResellerRegistration = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      province: formData.province.trim(),
      reseller_type: formData.reseller_type,
      business_name: formData.business_name.trim(),
      notes: formData.notes.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. Try saving to Supabase DB in background
    try {
      await supabase.from('reseller_registrations').insert([
        {
          name: registrationData.name,
          phone: registrationData.phone,
          email: registrationData.email,
          address: registrationData.address,
          city: registrationData.city,
          province: registrationData.province,
          reseller_type: registrationData.reseller_type,
          business_name: registrationData.business_name,
          notes: registrationData.notes,
        },
      ]);
    } catch (dbErr) {
      console.warn('Supabase save notice (non-fatal):', dbErr);
    }

    // 2. Send form data in background to admin email (shorttail.id@gmail.com) via FormSubmit AJAX endpoint
    try {
      await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `[Pendaftaran Reseller Baru] ${registrationData.name} - ${resellerTypeName}`,
          Tipe_Reseller: resellerTypeName,
          Nama_Lengkap: registrationData.name,
          No_WhatsApp: registrationData.phone,
          Email: registrationData.email,
          Nama_Usaha: registrationData.business_name || '-',
          Alamat: registrationData.address || '-',
          Kota: registrationData.city || '-',
          Provinsi: registrationData.province || '-',
          Catatan: registrationData.notes || '-',
          Waktu_Pendaftaran: new Date().toLocaleString('id-ID'),
        }),
      });
    } catch (emailErr) {
      console.warn('Background email dispatch notice:', emailErr);
    }

    // 3. Format WhatsApp chat message starting with required text
    let waMessage = `Halo Admin ShortTail.id 👋\n\n`;
    waMessage += `saya tertarik menjadi reseller shorttail.id\n\n`;
    waMessage += `*📋 Form Pendaftaran Reseller:*\n`;
    waMessage += `• *Tipe Kemitraan:* ${resellerTypeName}\n`;
    waMessage += `• *Nama Lengkap:* ${registrationData.name}\n`;
    waMessage += `• *No. WhatsApp:* ${registrationData.phone}\n`;
    waMessage += `• *Email:* ${registrationData.email}\n`;
    if (registrationData.business_name) {
      waMessage += `• *Nama Toko/Usaha:* ${registrationData.business_name}\n`;
    }
    if (registrationData.city || registrationData.address) {
      waMessage += `• *Lokasi/Alamat:* ${registrationData.address ? `${registrationData.address}, ` : ''}${registrationData.city}\n`;
    }
    if (registrationData.notes) {
      waMessage += `• *Catatan:* ${registrationData.notes}\n`;
    }
    waMessage += `\nMohon informasi selanjutnya mengenai syarat, katalog, dan harga reseller ya admin. Terima kasih! 🙏`;

    setLoading(false);
    setSubmitted(true);

    // Launch WhatsApp in background or new tab
    const encodedWa = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodedWa}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/80 relative max-h-[92vh] flex flex-col justify-between"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between relative shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-200 border border-white/20 shadow-inner">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-1.5">
                  Pendaftaran Reseller
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Official
                  </span>
                </h2>
                <p className="text-xs text-emerald-100/90">
                  Bergabung bersama ShortTail.id & Kembangkan Usaha Anda
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

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
            {submitted ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">
                    Pendaftaran Berhasil Dikirim!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Data pendaftaran reseller Anda telah dikirim ke email{' '}
                    <span className="font-bold text-slate-800">{ADMIN_EMAIL}</span> dan pesan WhatsApp telah dibuka.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-2 max-w-md mx-auto text-xs">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Langkah Selanjutnya:</span>
                  </div>
                  <ul className="text-slate-700 space-y-1 list-disc list-inside">
                    <li>Kirim pesan WhatsApp yang telah terbuka untuk konfirmasi cepat dengan admin.</li>
                    <li>Tim ShortTail.id akan meninjau pendaftaran dan mengirimkan price list & katalog resmi.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-200 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Step 1: Reseller Type Selection */}
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>Pilih Tipe Kemitraan Reseller *</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: With ShortTail.id Brand */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, reseller_type: 'shorttail_brand' }))
                      }
                      className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        formData.reseller_type === 'shorttail_brand'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            Brand ShortTail.id
                          </span>
                          {formData.reseller_type === 'shorttail_brand' && (
                            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Menjual produk resmi berlogo <strong>ShortTail.id</strong>. Lengkap dengan kemasan resmi berlabel.
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block w-fit">
                        Recommended
                      </div>
                    </button>

                    {/* Option 2: White Label */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, reseller_type: 'white_label' }))
                      }
                      className={`p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        formData.reseller_type === 'white_label'
                          ? 'border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                            White Label
                          </span>
                          {formData.reseller_type === 'white_label' && (
                            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Bebas dijual kembali menggunakan <strong>Brand / Merek Anda Sendiri</strong> tanpa atribut/kemasan packaging satuan atau logo ShortTail.id.
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md inline-block w-fit">
                        Brand Sendiri
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2: Customer Details Fields */}
                <div className="space-y-3 pt-1">
                  <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Data Pendaftar Reseller</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Nama Lengkap *</span>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Nama lengkap Anda..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">No. WhatsApp *</span>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Contoh: 08123456789"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Email */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Alamat Email *</span>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contoh@gmail.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Business/Store Name */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Nama Toko / Usaha (Opsional)</span>
                      <div className="relative">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          placeholder="Contoh: Toko Berkah / Online Shop"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* City & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Kota / Kabupaten</span>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Contoh: Jakarta Selatan"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Alamat Lengkap</span>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Jalan, No. Rumah, RT/RW..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Notes / Special Message */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Catatan / Pertanyaan Tambahan</span>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Tanyakan kuantitas pesanan, estimasi pengiriman, atau syarat khusus..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Formulir ini akan terkirim secara otomatis ke email admin{' '}
                    <span className="font-bold text-slate-800">{ADMIN_EMAIL}</span> dan membuka chat WhatsApp ke{' '}
                    <span className="font-bold text-slate-800">0878-8881-77362</span>.
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Form...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim & Chat WA Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
