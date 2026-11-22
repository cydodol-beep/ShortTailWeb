import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Activity, 
  MapPin, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Heart,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Siren
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Customer, PetData } from '../../types';
import { normalizePhoneNumber } from '../../lib/utils';
import { detectOneTimeGps, dispatchWhatsAppUrl } from '../../lib/gpsWhatsApp';

interface PublicPetTagPageProps {
  brandName?: string;
  storeLogo?: string | null;
}

export const PublicPetTagPage: React.FC<PublicPetTagPageProps> = ({
  brandName = 'ShortTail.id',
  storeLogo,
}) => {
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsAttempted, setGpsAttempted] = useState(false);
  const [preparedWaUrl, setPreparedWaUrl] = useState<string | null>(null);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
  const [customFinderMessage, setCustomFinderMessage] = useState<string>('');

  // Loaded Pet Data
  const [pet, setPet] = useState<{
    id: string;
    tag_number: number;
    name: string;
    subtitle: string;
    noteText: string;
    photoUrl: string;
    temperamentTitle: string;
    temperamentDesc: string;
    ownerName: string;
    ownerPhone: string;
    owner2Name: string;
    owner2Phone: string;
    vetName: string;
    vetPhone: string;
    microchipId: string;
    ownerAddress?: string;
    custom_wa_template?: string;
    enable_gps_sharing?: boolean;
    tagBadgeText?: string;
    textOwnerButtonLabel?: string;
    waCtaButtonLabel?: string;
  }>({
    id: 'default',
    tag_number: 1,
    name: 'Boss',
    subtitle: 'Hello, my name is',
    noteText: 'Please call my mum! She will be worried',
    photoUrl: '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png',
    temperamentTitle: 'I am nervous',
    temperamentDesc: 'Please be gentle with me',
    ownerName: 'Emma',
    ownerPhone: '087888177362',
    owner2Name: 'Sam',
    owner2Phone: '081298765432',
    vetName: 'Main Street Vet Clinic',
    vetPhone: '02195959595',
    microchipId: 'ID-982 000 123 451',
    enable_gps_sharing: false,
    tagBadgeText: '',
    textOwnerButtonLabel: '',
    waCtaButtonLabel: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const custParam = params.get('cust') || params.get('customer') || params.get('phone');
    const petParam = params.get('pet') || params.get('pet_id') || params.get('tag');

    if (custParam) {
      setLoading(true);
      const isUuid = custParam.includes('-');
      const query = isUuid
        ? supabase.from('customers').select('*').eq('id', custParam).maybeSingle()
        : supabase.from('customers').select('*').eq('phone', normalizePhoneNumber(custParam)).maybeSingle();

      const fetchCustomerTag = async () => {
        try {
          const { data, error } = await query;
          if (data) {
            const cust = data as Customer;
            let targetPet: any = null;

            if (cust.pets && Array.isArray(cust.pets) && cust.pets.length > 0) {
              if (petParam) {
                targetPet = cust.pets.find((p: any, idx: number) => 
                  p.id === petParam ||
                  String(p.tag_number) === petParam ||
                  String(idx + 1) === petParam ||
                  String(idx) === petParam ||
                  (p.name && p.name.toLowerCase() === petParam.toLowerCase())
                );
              }
              if (!targetPet) {
                targetPet = cust.pets[0];
              }
            }

            const tagNum = targetPet?.tag_number || 1;
            const photo = targetPet?.photoUrl || targetPet?.photo_url || targetPet?.image_url || '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png';

            setPet({
              id: targetPet?.id || `pet_${tagNum}`,
              tag_number: tagNum,
              name: targetPet?.name || 'Boss',
              subtitle: targetPet?.subtitle || 'Hello, my name is',
              noteText: targetPet?.noteText || `Please call my owner ${cust.name}!`,
              photoUrl: photo,
              temperamentTitle: targetPet?.temperamentTitle || 'I am nervous',
              temperamentDesc: targetPet?.temperamentDesc || 'Please be gentle with me',
              ownerName: cust.name,
              ownerPhone: cust.phone,
              owner2Name: targetPet?.secondaryContactName || targetPet?.owner2Name || 'Sam',
              owner2Phone: targetPet?.secondaryContactPhone || targetPet?.owner2Phone || '081298765432',
              vetName: targetPet?.vetName || 'Main Street Vet Clinic',
              vetPhone: targetPet?.vetPhone || '02195959595',
              microchipId: targetPet?.microchipId || `ID-982 000 123 45${tagNum}`,
              ownerAddress: `${cust.city || ''}, ${cust.province || ''}`,
              custom_wa_template: targetPet?.custom_wa_template || '',
              enable_gps_sharing: Boolean(targetPet?.enable_gps_sharing),
              tagBadgeText: targetPet?.tagBadgeText || '',
              textOwnerButtonLabel: targetPet?.textOwnerButtonLabel || '',
              waCtaButtonLabel: targetPet?.waCtaButtonLabel || '',
            });
          }
        } catch (err) {
          console.error('Error fetching public pet tag data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchCustomerTag();
    } else {
      setLoading(false);
    }
  }, []);

  const cleanPhone2 = pet.owner2Phone.replace(/[^0-9]/g, '');
  const cleanVetPhone = pet.vetPhone.replace(/[^0-9]/g, '');

  const getWhatsAppTargetPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const createWhatsAppMessageText = (coordsAddress?: string) => {
    const loc = coordsAddress || locationAddress;
    if (pet.custom_wa_template && pet.custom_wa_template.trim()) {
      let custom = pet.custom_wa_template
        .replace(/\[nama_anabul\]/gi, pet.name)
        .replace(/\[nama_pemilik\]/gi, pet.ownerName)
        .replace(/\[tag_number\]/gi, String(pet.tag_number));
      const locationPart = loc ? `\n\n📍 *Lokasi penemuan saat ini:* ${loc}` : '';
      return `${custom}${locationPart}`;
    }

    const greeting = `Halo kak ${pet.ownerName}, saya baru saja menemukan anabul kesayangan Anda yang hilang bernama *${pet.name}* (Tag #${pet.tag_number})!`;
    const condition = `Saat ini ${pet.name} dalam kondisi aman bersama saya.`;
    const locationPart = loc ? `\n📍 *Lokasi penemuan saat ini:* ${loc}` : '';
    const customPart = customFinderMessage.trim() ? `\n💬 *Catatan dari penemu:* "${customFinderMessage.trim()}"` : '';
    const closing = `\n\nMohon segera balas pesan ini atau telepon saya agar ${pet.name} bisa segera dijemput dan kembali pulang ke rumah ya. Terima kasih banyak!`;
    
    return `${greeting}\n\n${condition}${locationPart}${customPart}${closing}`;
  };

  const targetWhatsAppNumber = getWhatsAppTargetPhone(pet.ownerPhone);
  const whatsappUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText())}`;

  // One-time GPS detection & dispatch WhatsApp message (iOS & Android cross-platform)
  const handleSendWhatsAppWithOptionalGPS = (e?: React.MouseEvent) => {
    if (!pet.enable_gps_sharing || locationAddress || gpsAttempted) {
      if (e) e.preventDefault();
      const readyUrl = locationAddress
        ? `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(locationAddress))}`
        : whatsappUrl;
      const opened = dispatchWhatsAppUrl(readyUrl);
      if (!opened) {
        setPreparedWaUrl(readyUrl);
      }
      return;
    }

    if (e) e.preventDefault();
    setDetectingLocation(true);
    setGpsFeedback(null);

    // Must be invoked synchronously inside user click so iOS Safari & Android WebView preserve gesture token
    detectOneTimeGps((result) => {
      setDetectingLocation(false);
      setGpsAttempted(true);

      let finalUrl = whatsappUrl;
      if (result.success && result.locationText) {
        setLocationAddress(result.locationText);
        finalUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(result.locationText))}`;
        setGpsFeedback('✓ Lokasi GPS terlampir! Membuka WhatsApp...');
      } else if (result.reason === 'permission_denied') {
        setGpsFeedback('Akses lokasi tidak diizinkan. Pesan siap dikirim tanpa koordinat GPS.');
      } else if (result.reason === 'insecure_context') {
        setGpsFeedback('Koneksi non-HTTPS tidak mendukung GPS. Pesan siap dikirim tanpa koordinat.');
      } else {
        setGpsFeedback('Sinyal GPS tidak tersedia saat ini. Pesan siap dikirim tanpa koordinat.');
      }

      setPreparedWaUrl(finalUrl);
      dispatchWhatsAppUrl(finalUrl);
    });
  };

  const handleRetryGpsDetection = () => {
    setLocationAddress('');
    setGpsAttempted(false);
    setPreparedWaUrl(null);
    setGpsFeedback(null);
    setDetectingLocation(true);

    detectOneTimeGps((result) => {
      setDetectingLocation(false);
      setGpsAttempted(true);

      let finalUrl = whatsappUrl;
      if (result.success && result.locationText) {
        setLocationAddress(result.locationText);
        finalUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(result.locationText))}`;
        setGpsFeedback('✓ Lokasi GPS berhasil dideteksi & dilampirkan!');
      } else {
        setGpsFeedback('Lokasi GPS tetap tidak tersedia. Pastikan izin lokasi browser aktif.');
      }
      setPreparedWaUrl(finalUrl);
    });
  };

  const handleCopyTagUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FD] flex flex-col justify-between selection:bg-sky-200 font-sans text-slate-800">

      {/* Main View-Only Tag Card */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 sm:py-7 flex flex-col items-center">
        
        {loading ? (
          <div className="w-full bg-white rounded-3xl p-12 text-center space-y-3 shadow-lg border border-slate-100 my-8">
            <div className="w-10 h-10 border-3 border-[#1E5186] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Memuat Data Tag Darurat Anabul...</p>
          </div>
        ) : (
          /* Physical Tag Container - View-Only (Warm Cream, Stone Arch & Petrol Teal Theme) */
          <div className="w-full bg-[#F6F6F0] rounded-[36px] overflow-hidden shadow-2xl border-4 border-white relative flex flex-col">
            
            {/* Paw Print Decorative Background Watermarks */}
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 absolute top-5 left-5 text-[#CECABD] -rotate-12 pointer-events-none select-none"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="10" cy="11" r="2.6" />
              <circle cx="16.5" cy="8.5" r="2.6" />
              <circle cx="23" cy="10.5" r="2.6" />
              <circle cx="26.5" cy="16" r="2.4" />
              <path d="M18 14.5c-4.3 0-7.5 3.3-7.5 6.8 0 2.4 1.8 4.2 4.2 4.2 1.2 0 2.2-.5 3.3-.5s2.1.5 3.3.5c2.4 0 4.2-1.8 4.2-4.2 0-3.5-3.2-6.8-7.5-6.8z" />
            </svg>
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 absolute top-11 right-5 text-[#CECABD] rotate-12 pointer-events-none select-none"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="10" cy="11" r="2.6" />
              <circle cx="16.5" cy="8.5" r="2.6" />
              <circle cx="23" cy="10.5" r="2.6" />
              <circle cx="26.5" cy="16" r="2.4" />
              <path d="M18 14.5c-4.3 0-7.5 3.3-7.5 6.8 0 2.4 1.8 4.2 4.2 4.2 1.2 0 2.2-.5 3.3-.5s2.1.5 3.3.5c2.4 0 4.2-1.8 4.2-4.2 0-3.5-3.2-6.8-7.5-6.8z" />
            </svg>

            {/* Top Header Section */}
            <div className="pt-7 pb-3 text-center px-6 relative z-10">
              {/* Tag Number Identifier */}
              <div className="inline-block mb-1.5 px-3 py-0.5 bg-[#C5DEF4] text-[#24556F] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                {pet.tagBadgeText?.trim() || `Smart Collar Tag #${pet.tag_number}`}
              </div>

              {/* Cursive Handwriting Header: "Hello, my name is" */}
              <p 
                className="text-2xl sm:text-[28px] text-[#232A31] tracking-wide mb-0.5 select-none"
                style={{ fontFamily: "'Caveat', cursive, serif" }}
              >
                {pet.subtitle}
              </p>

              {/* Giant Friendly Pet Name */}
              <h1 className="text-5xl sm:text-6xl font-black text-[#24556F] tracking-tight leading-none select-none">
                {pet.name}
              </h1>
            </div>

            {/* Smooth Curved Stone Arch Layer containing Pet Photo */}
            <div className="relative pt-8 pb-8 flex flex-col items-center justify-center">
              <svg
                viewBox="0 0 400 220"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                aria-hidden="true"
              >
                <path
                  d="M 0,195 Q 200,-155 400,195 L 400,220 L 0,220 Z"
                  fill="#E5E3D9"
                />
              </svg>

              {/* Center Circular Pet Avatar Container (Pure view, no edit controls) */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative z-20 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#9BA79A]">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className={`w-full h-full object-cover ${
                      pet.photoUrl.includes('Screenshot')
                        ? 'scale-[2.2] object-[50%_33%]'
                        : ''
                    }`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png';
                    }}
                  />
                </div>

                {/* Curved SVG Text Path hugging the bottom arc of the Avatar */}
                <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                  <svg viewBox="0 0 240 240" className="w-56 h-56 sm:w-60 sm:h-60 overflow-visible">
                    <path
                      id="public-tag-curve-path"
                      d="M 28,128 A 92,92 0 0,0 212,128"
                      fill="none"
                    />
                    <text className="fill-[#232A31] font-bold text-[15px] select-none tracking-wide" style={{ fontFamily: "'Caveat', cursive, serif" }}>
                      <textPath href="#public-tag-curve-path" startOffset="50%" textAnchor="middle">
                        {pet.noteText}
                      </textPath>
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Lower Warm Stone Body */}
            <div className="bg-[#E5E3D9] pt-1 pb-2 relative z-10 flex flex-col">
              {/* Action Button: "Tombol Darurat" */}
              <div className="px-5 pt-1 pb-2.5 flex items-center justify-center relative z-10">
                {(!pet.enable_gps_sharing || locationAddress || gpsAttempted) ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-5 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md shadow-red-600/25 border border-red-700/80 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer whitespace-nowrap group"
                    title={`Kirim Pesan WhatsApp Darurat ke ${pet.ownerName}`}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#DC2626] transition-colors">
                      <Siren className="w-4 h-4" />
                    </span>
                    <span>{pet.textOwnerButtonLabel?.trim() || 'Tombol Darurat'}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendWhatsAppWithOptionalGPS}
                    disabled={detectingLocation}
                    className="w-full py-3 px-5 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-md shadow-red-600/25 border border-red-700/80 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer whitespace-nowrap group disabled:opacity-75"
                    title={`Kirim Pesan WhatsApp Darurat ke ${pet.ownerName}`}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#DC2626] transition-colors">
                      {detectingLocation ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                    </span>
                    <span>{detectingLocation ? 'Mendeteksi Lokasi...' : (pet.textOwnerButtonLabel?.trim() || 'Tombol Darurat')}</span>
                  </button>
                )}
              </div>

              {/* Temperament / Medical Alert Pill Card */}
              <div className="px-5 py-2 relative z-10">
                <div className="w-full bg-[#CBDCE3] border border-[#BACED7] rounded-full py-2.5 px-4 flex items-center space-x-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#779BAE] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm leading-snug text-[#273844]">
                    <strong className="font-extrabold text-[#1E2932]">{pet.temperamentTitle}</strong>{' '}
                    <span className="font-medium text-[#374854]">{pet.temperamentDesc}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA Button Highlight Card (Sending WhatsApp message to owner) */}
              <div className="px-5 pb-4 pt-2.5 relative z-10">
                <div className="bg-white rounded-2xl p-4 border border-[#ECEAE1] shadow-[0_6px_18px_rgba(0,0,0,0.06)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#1E2932]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D9822B]" />
                      Kirim Pesan WhatsApp ke Pemilik
                    </span>
                  </div>

                  {/* Primary Direct WhatsApp CTA Button -> Native <a> once GPS is off/resolved/attempted */}
                  {(!pet.enable_gps_sharing || locationAddress || gpsAttempted) ? (
                    <a
                      href={preparedWaUrl || whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#1FA845] hover:bg-[#19933B] active:bg-[#157D31] text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-700/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span>
                        {pet.waCtaButtonLabel?.trim()
                          ? pet.waCtaButtonLabel.replace(/\[nama_anabul\]/gi, pet.name)
                          : `Kirim kabar WA ke Pemilik Saya: "Saya Menemukan ${pet.name}"`}
                      </span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendWhatsAppWithOptionalGPS}
                      disabled={detectingLocation}
                      className="w-full py-3 px-4 bg-[#1FA845] hover:bg-[#19933B] active:bg-[#157D31] text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-700/15 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 text-center"
                    >
                      {detectingLocation ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0" />
                          <span>Mendeteksi Lokasi GPS & Membuka WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>
                            {pet.waCtaButtonLabel?.trim()
                              ? pet.waCtaButtonLabel.replace(/\[nama_anabul\]/gi, pet.name)
                              : `Kirim kabar WA ke Pemilik Saya: "Saya Menemukan ${pet.name}"`}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex flex-col items-center gap-1.5">
                    {pet.enable_gps_sharing && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                          locationAddress
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : 'text-[#1D5477] bg-[#DBEBF8] border-[#BDD7EC]'
                        }`}>
                          <MapPin className={`w-3 h-3 ${locationAddress ? 'text-emerald-600' : 'text-[#24556F]'}`} />
                          <span>{locationAddress ? 'Lokasi GPS Terlampir ✓' : 'One-Time GPS Sharing Aktif'}</span>
                        </span>
                        {gpsAttempted && !locationAddress && !detectingLocation && (
                          <button
                            type="button"
                            onClick={handleRetryGpsDetection}
                            className="text-[10px] text-[#24556F] hover:text-[#1A4358] underline font-semibold cursor-pointer"
                          >
                            Deteksi ulang GPS
                          </button>
                        )}
                      </div>
                    )}

                    {gpsFeedback && (
                      <p className="text-[10px] text-[#1D5477] bg-[#EAF4FC] border border-[#BDD7EC] px-2.5 py-1 rounded-lg text-center font-medium">
                        {gpsFeedback}
                      </p>
                    )}

                    <p className="text-[11px] text-[#5B646D] text-center leading-relaxed">
                      Pesan penemuan {pet.name} akan langsung terbuka di WhatsApp nomor pemilik <strong className="text-[#1E2932]">{pet.ownerPhone}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip: "TAP. CONNECT. GET ME HOME." */}
            <div className="bg-[#1A4358] text-white py-3.5 px-4 text-center text-[11px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2.5 select-none">
              <svg viewBox="0 0 36 36" className="w-3.5 h-3.5 text-[#CBDCE3]" fill="currentColor" aria-hidden="true">
                <circle cx="10" cy="11" r="2.6" />
                <circle cx="16.5" cy="8.5" r="2.6" />
                <circle cx="23" cy="10.5" r="2.6" />
                <circle cx="26.5" cy="16" r="2.4" />
                <path d="M18 14.5c-4.3 0-7.5 3.3-7.5 6.8 0 2.4 1.8 4.2 4.2 4.2 1.2 0 2.2-.5 3.3-.5s2.1.5 3.3.5c2.4 0 4.2-1.8 4.2-4.2 0-3.5-3.2-6.8-7.5-6.8z" />
              </svg>
              <span>TAP. CONNECT. GET ME HOME.</span>
              <svg viewBox="0 0 36 36" className="w-3.5 h-3.5 text-[#CBDCE3]" fill="currentColor" aria-hidden="true">
                <circle cx="10" cy="11" r="2.6" />
                <circle cx="16.5" cy="8.5" r="2.6" />
                <circle cx="23" cy="10.5" r="2.6" />
                <circle cx="26.5" cy="16" r="2.4" />
                <path d="M18 14.5c-4.3 0-7.5 3.3-7.5 6.8 0 2.4 1.8 4.2 4.2 4.2 1.2 0 2.2-.5 3.3-.5s2.1.5 3.3.5c2.4 0 4.2-1.8 4.2-4.2 0-3.5-3.2-6.8-7.5-6.8z" />
              </svg>
            </div>

          </div>
        )}

        {/* Footer Credit & Store Links */}
        <div className="mt-6 text-center space-y-2 text-xs text-slate-500">

          <p className="text-[11px] text-slate-400">
            Layanan Smart Tag Darurat Lost & Found dipersembahkan oleh{' '}
            <a
              href="https://shorttail.id"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-[#1E5186] transition-colors"
            >
              ShortTail.id
            </a>
          </p>
        </div>

      </main>

    </div>
  );
};
