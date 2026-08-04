import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { normalizePhoneNumber, formatDisplayPhone } from '../lib/utils';
import { Customer } from '../types';
import { Search, UserPlus, CheckCircle2, Phone, MapPin, Building, ArrowRight, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerValidationProps {
  onCustomerValidated: (customer: Customer) => void;
  onOpenPromptModal?: () => void;
  storeLogo?: string | null;
  storeName?: string;
}

export const CustomerValidation: React.FC<CustomerValidationProps> = ({
  onCustomerValidated,
  onOpenPromptModal,
  storeLogo: propStoreLogo,
  storeName: propStoreName,
}) => {
  const [storeLogo, setStoreLogo] = useState<string | null>(propStoreLogo || null);
  const [storeName, setStoreName] = useState<string>(propStoreName || 'ShortTail Web Store');

  useEffect(() => {
    if (propStoreLogo) setStoreLogo(propStoreLogo);
    if (propStoreName) setStoreName(propStoreName);
  }, [propStoreLogo, propStoreName]);

  useEffect(() => {
    if (!storeLogo) {
      supabase
        .from('store_settings')
        .select('store_logo, store_name')
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.store_logo) setStoreLogo(data.store_logo);
          if (data?.store_name) setStoreName(data.store_name);
        });
    }
  }, []);

  const [phoneInput, setPhoneInput] = useState('628');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '628',
    address: '',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    postcode: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // ensure it starts or formats nicely
    setPhoneInput(val);
    setSearched(false);
    setFoundCustomer(null);
    setErrorMsg('');
  };

  const handleSearchPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = normalizePhoneNumber(phoneInput);
    if (!formatted || formatted.length < 8) {
      setErrorMsg('Masukkan nomor telepon yang valid (minimal 8 digit)');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(false);
    setFoundCustomer(null);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', formatted)
        .limit(1);

      if (error) {
        console.error('Error searching customer:', error);
        setErrorMsg('Terjadi kesalahan saat memeriksa database.');
      } else if (data && data.length > 0) {
        setFoundCustomer(data[0] as Customer);
      } else {
        // No match -> prepare registration form with formatted phone
        setFormData((prev) => ({
          ...prev,
          phone: formatted,
        }));
      }
      setSearched(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal terhubung ke database. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('Alamat lengkap wajib diisi.');
      return;
    }

    const formattedPhone = normalizePhoneNumber(formData.phone);
    if (!formattedPhone || formattedPhone.length < 8) {
      setErrorMsg('Nomor HP tidak valid.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const newCust: Omit<Customer, 'id' | 'created_at'> = {
        name: formData.name.trim(),
        phone: formattedPhone,
        address: formData.address.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        postcode: formData.postcode.trim() || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([newCust])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        setErrorMsg('Gagal menyimpan data pelanggan baru: ' + error.message);
      } else if (data) {
        onCustomerValidated(data as Customer);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat pendaftaran pelanggan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden"
        >
          {/* Card Banner */}
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 text-slate-900">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-emerald-950">{storeName}</h2>
            </div>
            <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider">
              Customer Gateway &bull; Cek Data Pelanggan
            </p>
          </div>

          <div className="p-6">
            {/* Phone Search Form */}
            <form onSubmit={handleSearchPhone} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">
                  Step 1: Identity (Nomor HP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-semibold text-slate-400 text-sm">
                    +62
                  </div>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={handlePhoneInputChange}
                    placeholder="812 3456 7890 (atau 0812...)"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Format otomatis diawali <span className="font-semibold text-emerald-700">62</span>
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Check Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {errorMsg && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {searched && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-slate-100"
                >
                  {foundCustomer ? (
                    /* Existing Customer Found */
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-emerald-950 space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Data Pelanggan Ditemukan!</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                        <div className="font-bold text-slate-900 text-sm mb-1">{foundCustomer.name}</div>
                        <div className="flex items-center text-slate-600">
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                          {formatDisplayPhone(foundCustomer.phone)}
                        </div>
                        <div className="flex items-start text-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{foundCustomer.address}, {foundCustomer.city}, {foundCustomer.province} {foundCustomer.postcode || ''}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onCustomerValidated(foundCustomer)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Lanjutkan Belanja</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* New Customer Registration Form */
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs font-medium flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Nomor HP belum terdaftar. Silakan lengkapi pendaftaran di bawah ini:</span>
                      </div>

                      <form onSubmit={handleRegisterNewCustomer} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nama Lengkap <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nomor HP (Format 62...) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="628123456789"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Alamat Lengkap <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                            <input
                              type="text"
                              value={formData.province}
                              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
                          <input
                            type="text"
                            value={formData.postcode}
                            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                            placeholder="Contoh: 12340"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={saving}
                          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Daftar & Mulai Belanja</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        &copy; {new Date().getFullYear()} {storeName} POS Integration
      </div>
    </div>
  );
};
