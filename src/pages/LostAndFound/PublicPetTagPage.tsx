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
          /* Physical Tag Container - View-Only (Warm Paper, Terracotta & Sage Theme 3) */
          <div className="w-full bg-[#F7F5F0] rounded-[36px] overflow-hidden shadow-2xl border-4 border-[#FDFBF7] relative flex flex-col">
            
            {/* Paw Print Decorative Background Watermarks */}
            <svg
              viewBox="0 0 36 36"
              className="w-8 h-8 absolute top-5 left-5 text-[#CBC0AE] -rotate-12 pointer-events-none select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
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
              className="w-8 h-8 absolute top-11 right-5 text-[#CBC0AE] rotate-12 pointer-events-none select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
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
            <div className="pt-7 pb-2 text-center px-6 relative z-10">
              {/* Tag Number Identifier */}
              <div className="inline-block mb-2 px-3.5 py-0.5 bg-[#E3DACD] text-[#4A3728] border border-[#D7CBB9] font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-2xs">
                {pet.tagBadgeText?.trim() || `Smart Collar Tag #${pet.tag_number}`}
              </div>

              {/* Cursive Handwriting Header: "Hello, my name is" */}
              <p 
                className="text-2xl sm:text-[28px] text-[#5C4433] tracking-wide mb-0.5 select-none"
                style={{ fontFamily: "'Caveat', cursive, serif" }}
              >
                {pet.subtitle}
              </p>

              {/* Giant Friendly Pet Name */}
              <h1 className="text-5xl sm:text-6xl font-black text-[#BE7856] tracking-tight leading-none select-none">
                {pet.name}
              </h1>
            </div>

            {/* Pet Photo Avatar & Curved Handwritten Note */}
            <div className="relative pt-4 pb-8 flex flex-col items-center justify-center">
              {/* Center Circular Pet Avatar Container (Pure view, no edit controls) */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="relative z-20 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[5px] border-[#EAE3D7] ring-2 ring-[#C9BCAB] shadow-[0_6px_18px_rgba(92,68,51,0.16)] overflow-hidden bg-[#DED4C4]">
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
                    <text className="fill-[#4A3728] font-bold text-[15px] select-none tracking-wide" style={{ fontFamily: "'Caveat', cursive, serif" }}>
                      <textPath href="#public-tag-curve-path" startOffset="50%" textAnchor="middle">
                        {pet.noteText}
                      </textPath>
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Lower Warm Paper Body */}
            <div className="pt-1 pb-2 relative z-10 flex flex-col">
              {/* Action Button: "Tombol Darurat" */}
              <div className="px-5 pt-1 pb-2.5 flex items-center justify-center relative z-10">
                {(!pet.enable_gps_sharing || locationAddress || gpsAttempted) ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full py-3 px-5 bg-[#BD7858] hover:bg-[#AA6748] active:bg-[#97583B] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-[0_4px_14px_rgba(220,38,38,0.35)] border border-[#DC2626]/80 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer whitespace-nowrap group"
                    title={`Kirim Pesan WhatsApp Darurat ke ${pet.ownerName}`}
                  >
                    <span className="absolute -inset-0.5 rounded-full ring-2 ring-red-500/75 animate-pulse motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DC2626]/80 via-[#EF4444]/85 to-[#DC2626]/80 animate-pulse motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                    <span className="relative z-10 w-7 h-7 rounded-full bg-[#E3D7C4] text-[#991B1B] flex items-center justify-center shrink-0 group-hover:bg-[#FDFBF7] group-hover:text-[#DC2626] transition-colors shadow-2xs">
                      <span className="absolute inset-0 rounded-full bg-red-400/75 animate-ping motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                      <Siren className="relative z-10 w-4 h-4" />
                    </span>
                    <span className="relative z-10">{pet.textOwnerButtonLabel?.trim() || 'Tombol Darurat'}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendWhatsAppWithOptionalGPS}
                    disabled={detectingLocation}
                    className="relative w-full py-3 px-5 bg-[#BD7858] hover:bg-[#AA6748] active:bg-[#97583B] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-[0_4px_14px_rgba(220,38,38,0.35)] border border-[#DC2626]/80 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] cursor-pointer whitespace-nowrap group disabled:opacity-75"
                    title={`Kirim Pesan WhatsApp Darurat ke ${pet.ownerName}`}
                  >
                    <span className="absolute -inset-0.5 rounded-full ring-2 ring-red-500/75 animate-pulse motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DC2626]/80 via-[#EF4444]/85 to-[#DC2626]/80 animate-pulse motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                    <span className="relative z-10 w-7 h-7 rounded-full bg-[#E3D7C4] text-[#991B1B] flex items-center justify-center shrink-0 group-hover:bg-[#FDFBF7] group-hover:text-[#DC2626] transition-colors shadow-2xs">
                      {!detectingLocation && (
                        <span className="absolute inset-0 rounded-full bg-red-400/75 animate-ping motion-reduce:animate-none pointer-events-none" aria-hidden="true" />
                      )}
                      {detectingLocation ? <RefreshCw className="relative z-10 w-4 h-4 animate-spin" /> : <Siren className="relative z-10 w-4 h-4" />}
                    </span>
                    <span className="relative z-10">{detectingLocation ? 'Mendeteksi Lokasi...' : (pet.textOwnerButtonLabel?.trim() || 'Tombol Darurat')}</span>
                  </button>
                )}
              </div>

              {/* Temperament / Medical Alert Pill Card */}
              <div className="px-5 py-2 relative z-10">
                <div className="w-full bg-[#ECE7DF] border border-[#DDD5C7] rounded-full py-2.5 px-4 flex items-center space-x-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-full bg-[#BD7858] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm leading-snug text-[#5A4636]">
                    <strong className="font-extrabold text-[#3B2A1E]">{pet.temperamentTitle}</strong>{' '}
                    <span className="font-medium text-[#5A4636]">{pet.temperamentDesc}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA Button Highlight Card (Sending WhatsApp message to owner) */}
              <div className="px-5 pb-4 pt-2.5 relative z-10">
                <div className="bg-[#FCFBF8] rounded-2xl p-4 border border-[#E4DDD0] shadow-[0_6px_18px_rgba(92,68,51,0.08)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#3B2A1E]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C68642]" />
                      Kirim Pesan WhatsApp ke Pemilik
                    </span>
                  </div>

                  {/* Primary Direct WhatsApp CTA Button -> Native <a> once GPS is off/resolved/attempted */}
                  {(!pet.enable_gps_sharing || locationAddress || gpsAttempted) ? (
                    <a
                      href={preparedWaUrl || whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#768E75] hover:bg-[#647B63] active:bg-[#556A54] text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_12px_rgba(90,115,88,0.28)] border border-[#688067] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center"
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
                      className="w-full py-3 px-4 bg-[#768E75] hover:bg-[#647B63] active:bg-[#556A54] text-white font-extrabold text-sm rounded-2xl shadow-[0_4px_12px_rgba(90,115,88,0.28)] border border-[#688067] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75 text-center"
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
                            ? 'text-[#355234] bg-[#E5EDE4] border-[#C6D6C4]'
                            : 'text-[#4A3728] bg-[#E8DFD1] border-[#D7CBB8]'
                        }`}>
                          <MapPin className={`w-3 h-3 ${locationAddress ? 'text-[#4E734C]' : 'text-[#8C5A3C]'}`} />
                          <span>{locationAddress ? 'Lokasi GPS Terlampir ✓' : 'One-Time GPS Sharing Aktif'}</span>
                        </span>
                        {gpsAttempted && !locationAddress && !detectingLocation && (
                          <button
                            type="button"
                            onClick={handleRetryGpsDetection}
                            className="text-[10px] text-[#8C5A3C] hover:text-[#4A3728] underline font-semibold cursor-pointer"
                          >
                            Deteksi ulang GPS
                          </button>
                        )}
                      </div>
                    )}

                    {gpsFeedback && (
                      <p className="text-[10px] text-[#4A3728] bg-[#F2ECE2] border border-[#DDD3C3] px-2.5 py-1 rounded-lg text-center font-medium">
                        {gpsFeedback}
                      </p>
                    )}

                    <p className="text-[11px] text-[#5C4B3E] text-center leading-relaxed">
                      Pesan penemuan {pet.name} akan langsung terbuka di WhatsApp nomor pemilik <strong className="text-[#3B2A1E]">{pet.ownerPhone}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip: "TAP. CONNECT. GET ME HOME." */}
            <div className="bg-[#9F4716] text-[#FDFBF7] py-3.5 px-4 text-center text-[11px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2.5 select-none">
              <svg viewBox="0 0 36 36" className="w-3.5 h-3.5 text-[#E8D5C4]" fill="currentColor" aria-hidden="true">
                <circle cx="10" cy="11" r="2.6" />
                <circle cx="16.5" cy="8.5" r="2.6" />
                <circle cx="23" cy="10.5" r="2.6" />
                <circle cx="26.5" cy="16" r="2.4" />
                <path d="M18 14.5c-4.3 0-7.5 3.3-7.5 6.8 0 2.4 1.8 4.2 4.2 4.2 1.2 0 2.2-.5 3.3-.5s2.1.5 3.3.5c2.4 0 4.2-1.8 4.2-4.2 0-3.5-3.2-6.8-7.5-6.8z" />
              </svg>
              <span>TAP. CONNECT. GET ME HOME.</span>
              <svg viewBox="0 0 36 36" className="w-3.5 h-3.5 text-[#E8D5C4]" fill="currentColor" aria-hidden="true">
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
