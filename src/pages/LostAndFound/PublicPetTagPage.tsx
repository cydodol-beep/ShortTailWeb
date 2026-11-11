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
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Customer, PetData } from '../../types';
import { normalizePhoneNumber } from '../../lib/utils';

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

  // One-time GPS detection & dispatch WhatsApp message
  const handleSendWhatsAppWithOptionalGPS = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!pet.enable_gps_sharing) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (locationAddress) {
      const directUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(locationAddress))}`;
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!navigator.geolocation) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setDetectingLocation(true);
    let handled = false;

    const timer = setTimeout(() => {
      if (!handled) {
        handled = true;
        setDetectingLocation(false);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (handled) return;
        handled = true;
        clearTimeout(timer);
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        const locText = `https://maps.google.com/?q=${lat},${lng} (Lat: ${lat}, Lng: ${lng})`;
        setLocationAddress(locText);
        setDetectingLocation(false);

        const targetUrlWithGPS = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(locText))}`;
        window.open(targetUrlWithGPS, '_blank', 'noopener,noreferrer');
      },
      (err) => {
        if (handled) return;
        handled = true;
        clearTimeout(timer);
        console.warn('GPS detection denied or timed out:', err.message);
        setDetectingLocation(false);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      },
      { timeout: 4500, enableHighAccuracy: true, maximumAge: 60000 }
    );
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
          /* Physical Tag Container - Identical to Reference Image */
          <div className="w-full bg-[#EAF4FC] rounded-[36px] overflow-hidden shadow-2xl border-4 border-white/80 relative flex flex-col">
            
            {/* Paw Print Decorative Background Watermarks */}
            <div className="absolute top-6 left-6 text-sky-200/50 pointer-events-none select-none text-3xl font-mono">
              🐾
            </div>
            <div className="absolute top-12 right-6 text-sky-200/50 pointer-events-none select-none text-3xl font-mono">
              🐾
            </div>
            <div className="absolute bottom-32 left-8 text-sky-200/50 pointer-events-none select-none text-3xl font-mono">
              🐾
            </div>

            {/* Top Wavy Header Section */}
            <div className="pt-8 pb-3 text-center px-6 relative z-10">
              {/* Tag Number Identifier */}
              <div className="inline-block mb-1 px-2.5 py-0.5 bg-sky-200/60 text-[#1E5186] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                Smart Collar Tag #{pet.tag_number}
              </div>

              {/* Cursive Handwriting Header: "Hello, my name is" */}
              <p 
                className="text-2xl sm:text-3xl text-slate-700 tracking-wide mb-1 select-none"
                style={{ fontFamily: "'Caveat', cursive, serif" }}
              >
                {pet.subtitle}
              </p>

              {/* Giant Friendly Pet Name */}
              <h1 className="text-5xl sm:text-6xl font-black text-[#5B9BD5] tracking-tight drop-shadow-xs select-none">
                {pet.name}
              </h1>
            </div>

            {/* Organic Darker Wavy Mid-Layer containing Pet Photo */}
            <div className="relative mt-1 mb-3">
              
              {/* Background Wavy SVG Layer */}
              <div className="w-full h-48 sm:h-52 bg-gradient-to-b from-[#2E6B9E] via-[#2A6596] to-[#255883] rounded-t-[54px] rounded-b-[54px] flex flex-col items-center justify-center relative shadow-inner overflow-visible">
                
                {/* Center Circular Pet Avatar Container (Pure view, no edit controls) */}
                <div className="relative z-20 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-900">
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
                  <svg viewBox="0 0 240 240" className="w-60 h-60 overflow-visible">
                    <path
                      id="public-tag-curve-path"
                      d="M 28,125 A 92,92 0 0,0 212,125"
                      fill="none"
                    />
                    <text className="fill-white font-bold text-[15px] drop-shadow-md select-none tracking-wide" style={{ fontFamily: "'Caveat', cursive, serif" }}>
                      <textPath href="#public-tag-curve-path" startOffset="50%" textAnchor="middle">
                        {pet.noteText}
                      </textPath>
                    </text>
                  </svg>
                </div>

              </div>
            </div>

            {/* Action Button: "Text my owner" */}
            <div className="px-5 pt-3 pb-2 flex items-center justify-center relative z-10">
              <button
                type="button"
                onClick={handleSendWhatsAppWithOptionalGPS}
                disabled={detectingLocation}
                className="w-full py-3 px-5 bg-white hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 font-bold text-xs sm:text-sm rounded-full shadow-md border border-slate-200/80 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer whitespace-nowrap group disabled:opacity-75"
                title={`Kirim Pesan WhatsApp ke ${pet.ownerName}`}
              >
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {detectingLocation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                </span>
                <span>{detectingLocation ? 'Mendeteksi Lokasi...' : 'Text my owner'}</span>
              </button>
            </div>

            {/* Temperament / Medical Alert Pill Card */}
            <div className="px-5 py-3 relative z-10">
              <div className="w-full bg-[#E1EEF8] border border-[#BFD9EE] rounded-full py-2.5 px-4 flex items-center space-x-3 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#4682B4] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm leading-snug text-[#2B547E]">
                  <strong className="font-extrabold text-[#1F497D]">{pet.temperamentTitle}</strong>{' '}
                  <span className="font-medium text-slate-700">{pet.temperamentDesc}</span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp CTA Button Highlight Card (Sending WhatsApp message to owner) */}
            <div className="px-5 pb-5 pt-3 relative z-10">
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 border border-sky-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E5186]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Kirim Pesan WhatsApp ke Pemilik
                  </span>
                </div>

                {/* Primary Direct WhatsApp CTA Button */}
                <button
                  type="button"
                  onClick={handleSendWhatsAppWithOptionalGPS}
                  disabled={detectingLocation}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {detectingLocation ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Mendeteksi Lokasi GPS & Membuka WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Kirim kabar WA ke Pemilik Saya: "Saya Menemukan {pet.name}"</span>
                    </>
                  )}
                </button>

                <div className="flex flex-col items-center gap-1">
                  {pet.enable_gps_sharing && (
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-sky-200">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>One-Time GPS Sharing Aktif</span>
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Pesan penemuan {pet.name} akan langsung terbuka di WhatsApp nomor pemilik <strong>{pet.ownerPhone}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Strip: "TAP. CONNECT. GET ME HOME." */}
            <div className="bg-[#1E5186] text-white py-3 px-4 text-center text-[11px] sm:text-xs font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 select-none">
              <span>🐾</span>
              <span>TAP. CONNECT. GET ME HOME.</span>
              <span>🐾</span>
            </div>

          </div>
        )}

        {/* Footer Credit & Store Links */}
        <div className="mt-6 text-center space-y-2 text-xs text-slate-500">

          <p className="text-[11px] text-slate-400">
            Layanan Smart Pet Tag Darurat Lost & Found dipersembahkan oleh{' '}
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
