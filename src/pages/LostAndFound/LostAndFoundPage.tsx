import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Heart, 
  Activity, 
  MapPin, 
  Share2, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  Edit3, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Info, 
  UserCheck, 
  RefreshCw, 
  LogIn, 
  PlusCircle, 
  Layers, 
  Link as LinkIcon, 
  Trash2, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Camera,
  Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Customer, PetData } from '../../types';
import { normalizePhoneNumber } from '../../lib/utils';

interface LostAndFoundPageProps {
  onBackToStore?: () => void;
  brandName?: string;
  storeLogo?: string | null;
  customer?: Customer | null;
  onCustomerUpdate?: (updatedCustomer: Customer) => void;
  onOpenCheckMember?: () => void;
}

interface PetProfile {
  id: string;
  tag_number: number;
  name: string;
  subtitle: string;
  noteText: string;
  photoUrl: string;
  temperamentTitle: string;
  temperamentDesc: string;
  owner1Name: string;
  owner1Phone: string;
  owner2Name: string;
  owner2Phone: string;
  vetName: string;
  vetPhone: string;
  microchipId: string;
  rewardNote: string;
  permanent_link: string;
  custom_wa_template?: string;
  enable_gps_sharing?: boolean;
}

// Generate unique permanent Lost & Found URL for a specific pet (view-only public page after scanning QR tag)
const buildPermanentPetLink = (customerIdOrPhone: string, petId: string, tagNumber: number): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shorttail.id';
  return `${origin}/?page=tag&cust=${encodeURIComponent(customerIdOrPhone)}&pet=${encodeURIComponent(petId || String(tagNumber))}`;
};

export const LostAndFoundPage: React.FC<LostAndFoundPageProps> = ({
  onBackToStore,
  brandName = 'ShortTail.id',
  storeLogo,
  customer: propCustomer,
  onCustomerUpdate,
  onOpenCheckMember,
}) => {
  // 1. Resolve active customer from prop or localStorage
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(() => {
    if (propCustomer) return propCustomer;
    try {
      const saved = localStorage.getItem('shorttail_active_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (propCustomer) {
      setActiveCustomer(propCustomer);
    }
  }, [propCustomer]);

  // Default baseline pet template
  const createDefaultPet = (ownerName = 'Emma', ownerPhone = '087888177362', tagNum = 1, petName = 'Boss'): PetProfile => {
    const custId = activeCustomer?.id || activeCustomer?.phone || 'guest';
    const petId = `pet_${tagNum}_${petName.toLowerCase().replace(/\s+/g, '_')}`;
    return {
      id: petId,
      tag_number: tagNum,
      name: petName,
      subtitle: 'Hello, my name is',
      noteText: `Please call my mum! She will be worried`,
      photoUrl: '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png',
      temperamentTitle: 'I am nervous',
      temperamentDesc: 'Please be gentle with me',
      owner1Name: ownerName,
      owner1Phone: ownerPhone,
      owner2Name: 'Sam',
      owner2Phone: '081298765432',
      vetName: 'Main Street Vet Clinic',
      vetPhone: '02195959595',
      microchipId: `ID-982 000 123 45${tagNum}`,
      rewardNote: 'Hadiah / Reward tersedia bagi yang menemukan & merawat dengan baik.',
      permanent_link: buildPermanentPetLink(custId, petId, tagNum),
      enable_gps_sharing: false,
    };
  };

  // Convert raw DB pet object into full PetProfile
  const normalizePetData = (raw: any, index: number, cust: Customer | null): PetProfile => {
    const custId = cust?.id || cust?.phone || 'guest';
    const tagNum = raw.tag_number || (index + 1);
    const petId = raw.id || `pet_${tagNum}_${(raw.name || 'anabul').toLowerCase().replace(/\s+/g, '_')}`;
    const ownerName = cust ? cust.name : (raw.owner1Name || 'Emma');
    const ownerPhone = cust ? cust.phone : (raw.owner1Phone || '087888177362');

    return {
      id: petId,
      tag_number: tagNum,
      name: raw.name || (index === 0 ? 'Boss' : `Anabul #${tagNum}`),
      subtitle: raw.subtitle || 'Hello, my name is',
      noteText: raw.noteText || `Please call my owner ${ownerName}!`,
      photoUrl: raw.photoUrl || raw.photo_url || raw.image_url || raw.image || '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png',
      temperamentTitle: raw.temperamentTitle || 'I am nervous',
      temperamentDesc: raw.temperamentDesc || 'Please be gentle with me',
      owner1Name: ownerName,
      owner1Phone: ownerPhone,
      owner2Name: raw.secondaryContactName || raw.owner2Name || 'Sam',
      owner2Phone: raw.secondaryContactPhone || raw.owner2Phone || '081298765432',
      vetName: raw.vetName || 'Main Street Vet Clinic',
      vetPhone: raw.vetPhone || '02195959595',
      microchipId: raw.microchipId || `ID-982 000 123 45${tagNum}`,
      rewardNote: raw.rewardNote || 'Hadiah / Reward tersedia bagi yang menemukan & merawat dengan baik.',
      permanent_link: raw.permanent_link || buildPermanentPetLink(custId, petId, tagNum),
      custom_wa_template: raw.custom_wa_template || '',
      enable_gps_sharing: Boolean(raw.enable_gps_sharing),
    };
  };

  // 2. Multi-pet state list
  const [petsList, setPetsList] = useState<PetProfile[]>(() => {
    if (activeCustomer) {
      if (activeCustomer.pets && activeCustomer.pets.length > 0) {
        return activeCustomer.pets.map((p, idx) => normalizePetData(p, idx, activeCustomer));
      }
      try {
        const localList = localStorage.getItem(`shorttail_pets_${activeCustomer.phone}`);
        if (localList) {
          const parsed = JSON.parse(localList);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p, idx) => normalizePetData(p, idx, activeCustomer));
          }
        }
      } catch {
        // ignore
      }
      return [createDefaultPet(activeCustomer.name, activeCustomer.phone, 1, 'Boss')];
    }
    return [createDefaultPet('Emma', '087888177362', 1, 'Boss')];
  });

  // Selected pet index
  const [selectedPetIndex, setSelectedPetIndex] = useState<number>(0);

  // Modal states
  const [isPetSelectorModalOpen, setIsPetSelectorModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isPublicViewer, setIsPublicViewer] = useState(false);
  const [publicOwnerInfo, setPublicOwnerInfo] = useState<{ name: string; phone: string } | null>(null);

  // New Pet Form State
  const [newPetForm, setNewPetForm] = useState({
    name: '',
    subtitle: 'Hello, my name is',
    noteText: 'Please call my mum! She will be worried',
    temperamentTitle: 'Very friendly',
    temperamentDesc: 'Loves gentle pats & belly rubs',
    vetName: 'Main Street Vet Clinic',
    vetPhone: '02195959595',
    microchipId: '',
    photoUrl: '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png',
  });

  // Geolocation & finder notes
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [customFinderMessage, setCustomFinderMessage] = useState<string>('');

  // 3. Handle Direct Link Opening by Copy-Pasting in Web Browser (No Login Needed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const custParam = params.get('cust') || params.get('customer') || params.get('phone') || params.get('member');
    const petParam = params.get('pet') || params.get('pet_id') || params.get('tag');

    if (custParam) {
      // Look up customer in Supabase by ID or by Phone
      const query = custParam.includes('-') 
        ? supabase.from('customers').select('*').eq('id', custParam).maybeSingle()
        : supabase.from('customers').select('*').eq('phone', normalizePhoneNumber(custParam)).maybeSingle();

      query.then(({ data, error }) => {
        if (data) {
          const cust = data as Customer;
          setPublicOwnerInfo({ name: cust.name, phone: cust.phone });
          setIsPublicViewer(true);

          let loadedPets: PetProfile[] = [];
          if (cust.pets && cust.pets.length > 0) {
            loadedPets = cust.pets.map((p, idx) => normalizePetData(p, idx, cust));
          } else {
            loadedPets = [createDefaultPet(cust.name, cust.phone, 1, 'Boss')];
          }

          setPetsList(loadedPets);

          // Find requested pet
          if (petParam) {
            const foundIndex = loadedPets.findIndex((p, idx) => 
              p.id === petParam || 
              String(p.tag_number) === petParam || 
              String(idx + 1) === petParam || 
              String(idx) === petParam ||
              p.name.toLowerCase() === petParam.toLowerCase()
            );
            if (foundIndex !== -1) {
              setSelectedPetIndex(foundIndex);
            }
          } else if (loadedPets.length > 1) {
            // Auto prompt selection if more than 1 pet
            setIsPetSelectorModalOpen(true);
          }
        }
      });
    }
  }, []);

  // 4. Auto-open pet selector if logged-in customer has multiple pets and no specific pet was requested
  useEffect(() => {
    if (activeCustomer && petsList.length > 1 && !isPublicViewer) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('pet')) {
        setIsPetSelectorModalOpen(true);
      }
    }
  }, [petsList.length, activeCustomer]);

  // Current active pet
  const currentPet: PetProfile = petsList[selectedPetIndex] || petsList[0] || createDefaultPet();

  // Synchronized Owner Details
  const effectiveOwnerName = publicOwnerInfo ? publicOwnerInfo.name : (activeCustomer ? activeCustomer.name : currentPet.owner1Name);
  const effectiveOwnerPhone = publicOwnerInfo ? publicOwnerInfo.phone : (activeCustomer ? activeCustomer.phone : currentPet.owner1Phone);

  const cleanPhone2 = currentPet.owner2Phone.replace(/[^0-9]/g, '');
  const cleanVetPhone = currentPet.vetPhone.replace(/[^0-9]/g, '');

  const getWhatsAppTargetPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  // Function to build WhatsApp message with optional dynamic coordinates
  const createWhatsAppMessageText = (coordsAddress?: string) => {
    const loc = coordsAddress || locationAddress;
    if (currentPet.custom_wa_template && currentPet.custom_wa_template.trim()) {
      let custom = currentPet.custom_wa_template
        .replace(/\[nama_anabul\]/gi, currentPet.name)
        .replace(/\[nama_pemilik\]/gi, effectiveOwnerName)
        .replace(/\[tag_number\]/gi, String(currentPet.tag_number));
      const locationPart = loc ? `\n\n📍 *Lokasi penemuan saat ini:* ${loc}` : '';
      return `${custom}${locationPart}`;
    }

    const greeting = `Halo kak ${effectiveOwnerName}, saya baru saja menemukan anabul kesayangan Anda yang hilang bernama *${currentPet.name}* (Tag #${currentPet.tag_number})!`;
    const condition = `Saat ini ${currentPet.name} dalam kondisi aman bersama saya.`;
    const locationPart = loc ? `\n📍 *Lokasi penemuan saat ini:* ${loc}` : '';
    const customPart = customFinderMessage.trim() ? `\n💬 *Catatan dari penemu:* "${customFinderMessage.trim()}"` : '';
    const closing = `\n\nMohon segera balas pesan ini atau telepon saya agar ${currentPet.name} bisa segera dijemput dan kembali pulang ke rumah ya. Terima kasih banyak!`;
    
    return `${greeting}\n\n${condition}${locationPart}${customPart}${closing}`;
  };

  const targetWhatsAppNumber = getWhatsAppTargetPhone(effectiveOwnerPhone);
  const whatsappUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText())}`;

  // One-time GPS detection & dispatch WhatsApp message
  const handleSendWhatsAppWithOptionalGPS = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    // If GPS sharing is NOT enabled for this pet, open WhatsApp immediately
    if (!currentPet.enable_gps_sharing) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // If already detected location previously
    if (locationAddress) {
      const directUrl = `https://wa.me/${targetWhatsAppNumber}?text=${encodeURIComponent(createWhatsAppMessageText(locationAddress))}`;
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Perform One-Time GPS Detection
    if (!navigator.geolocation) {
      // Fallback without GPS
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setDetectingLocation(true);
    let handled = false;

    // Timeout safety fallback after 5 seconds so user is never stuck
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
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
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
        console.warn('One-Time GPS detection skipped or denied:', err.message);
        setDetectingLocation(false);
        // Still proceed to WhatsApp without GPS coordinates
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      },
      { timeout: 4500, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  // Copy unique permanent link of current pet & save/sync directly to Supabase customers.pet_links column
  const handleCopyPermanentLink = async (petUrl?: string) => {
    const targetUrl = petUrl || currentPet.permanent_link;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);

    // Save/update this pet's permanent link to Supabase `customers.pet_links`
    if (activeCustomer && activeCustomer.id) {
      try {
        // Fetch fresh customer data to ensure non-overlapping merge
        const { data: latestCust } = await supabase
          .from('customers')
          .select('id, pet_links, pets')
          .eq('id', activeCustomer.id)
          .maybeSingle();

        const existingMap: Record<string, string> = {
          ...(latestCust?.pet_links || activeCustomer.pet_links || {}),
        };

        // Key by pet id and pet tag number so it is easily retrieved and editable/replaceable
        existingMap[currentPet.id] = targetUrl;
        existingMap[`tag_${currentPet.tag_number}`] = targetUrl;
        if (currentPet.name) {
          existingMap[`pet_${currentPet.name.toLowerCase().replace(/\s+/g, '_')}`] = targetUrl;
        }

        // Also ensure the pets array in DB has this permanent_link property updated
        const updatedPets = (latestCust?.pets || activeCustomer.pets || petsList).map((p: any) => {
          if (p.id === currentPet.id || p.tag_number === currentPet.tag_number || (p.name && p.name.toLowerCase() === currentPet.name.toLowerCase())) {
            return { ...p, permanent_link: targetUrl };
          }
          return p;
        });

        // Update Supabase
        const { error: updateErr } = await supabase
          .from('customers')
          .update({
            pet_links: existingMap,
            pets: updatedPets,
          })
          .eq('id', activeCustomer.id);

        if (updateErr) {
          console.warn('Gagal update pet_links di database:', updateErr.message);
        } else {
          // Update local customer state
          const updatedCustomerObj: Customer = {
            ...activeCustomer,
            pet_links: existingMap,
            pets: updatedPets,
          };
          localStorage.setItem('shorttail_active_customer', JSON.stringify(updatedCustomerObj));
          setActiveCustomer(updatedCustomerObj);
          if (onCustomerUpdate) {
            onCustomerUpdate(updatedCustomerObj);
          }
        }
      } catch (err) {
        console.warn('Error saat menyimpan pet_links ke database:', err);
      }
    }

    setSaveToast(`✓ Link permanen ${currentPet.name} tersalin & tersimpan ke database (pet_links)!`);
    setTimeout(() => {
      setCopiedLink(false);
      setSaveToast(null);
    }, 4500);
  };

  // Save changes to current pet and persist all pets to Supabase & localStorage
  const handleSavePetChanges = async () => {
    setIsSavingPet(true);
    try {
      const updatedList = [...petsList];
      updatedList[selectedPetIndex] = {
        ...currentPet,
        owner1Name: effectiveOwnerName,
        owner1Phone: effectiveOwnerPhone,
      };

      await syncPetsToDatabase(updatedList);
      setPetsList(updatedList);
      setIsEditModalOpen(false);
      setSaveToast(`✓ Data profil anabul ${currentPet.name} berhasil diperbarui & disimpan ke database!`);
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err: any) {
      console.error('Error saving pet:', err);
      alert('Terjadi kesalahan saat menyimpan data anabul.');
    } finally {
      setIsSavingPet(false);
    }
  };

  // Add a new Pet for this customer
  const handleAddNewPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetForm.name.trim()) {
      alert('Silakan masukkan nama anabul');
      return;
    }

    setIsSavingPet(true);
    try {
      const nextTagNumber = petsList.length + 1;
      const custId = activeCustomer?.id || activeCustomer?.phone || 'guest';
      const petId = `pet_${nextTagNumber}_${newPetForm.name.trim().toLowerCase().replace(/\s+/g, '_')}`;
      
      const newPetProfile: PetProfile = {
        id: petId,
        tag_number: nextTagNumber,
        name: newPetForm.name.trim(),
        subtitle: newPetForm.subtitle.trim() || 'Hello, my name is',
        noteText: newPetForm.noteText.trim() || `Please call my owner ${effectiveOwnerName}!`,
        photoUrl: newPetForm.photoUrl || '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png',
        temperamentTitle: newPetForm.temperamentTitle.trim() || 'Friendly',
        temperamentDesc: newPetForm.temperamentDesc.trim() || 'Loves belly rubs',
        owner1Name: effectiveOwnerName,
        owner1Phone: effectiveOwnerPhone,
        owner2Name: currentPet.owner2Name || 'Sam',
        owner2Phone: currentPet.owner2Phone || '081298765432',
        vetName: newPetForm.vetName.trim() || 'Main Street Vet Clinic',
        vetPhone: newPetForm.vetPhone.trim() || '02195959595',
        microchipId: newPetForm.microchipId.trim() || `ID-982 000 123 45${nextTagNumber}`,
        rewardNote: 'Hadiah / Reward tersedia bagi yang menemukan & merawat dengan baik.',
        permanent_link: buildPermanentPetLink(custId, petId, nextTagNumber),
      };

      const updatedList = [...petsList, newPetProfile];
      await syncPetsToDatabase(updatedList);
      
      setPetsList(updatedList);
      setSelectedPetIndex(updatedList.length - 1);
      setIsAddPetModalOpen(false);
      setIsPetSelectorModalOpen(false);

      setSaveToast(`✓ Anabul baru #${nextTagNumber} "${newPetProfile.name}" berhasil ditambahkan & memiliki link permanen unik!`);
      setTimeout(() => setSaveToast(null), 5000);
    } catch (err: any) {
      console.error('Error adding pet:', err);
      alert('Gagal menambahkan anabul baru: ' + err.message);
    } finally {
      setIsSavingPet(false);
    }
  };

  // Helper to sync pet array and pet_links column to Supabase
  const syncPetsToDatabase = async (listToSave: PetProfile[]) => {
    if (!activeCustomer) return;

    // Build dictionary mapping pet_id / tag_number to permanent link
    const petLinksMap: Record<string, string> = {};
    listToSave.forEach((p) => {
      petLinksMap[p.id] = p.permanent_link;
      petLinksMap[`tag_${p.tag_number}`] = p.permanent_link;
    });

    // 1. Update Supabase `customers` table
    if (activeCustomer.id) {
      // First update `pets` column
      const updatePayload: any = {
        pets: listToSave,
      };

      // Try updating `pet_links` column if exists in DB (safe with fallback)
      const resWithLinks = await supabase
        .from('customers')
        .update({ pets: listToSave, pet_links: petLinksMap })
        .eq('id', activeCustomer.id);

      if (resWithLinks.error) {
        console.warn('pet_links update error (fallback to pets array):', resWithLinks.error.message);
        // Fallback update pets only
        await supabase
          .from('customers')
          .update(updatePayload)
          .eq('id', activeCustomer.id);
      }
    }

    // 2. Persist in localStorage
    localStorage.setItem(`shorttail_pets_${activeCustomer.phone}`, JSON.stringify(listToSave));
    const updatedCust: Customer = {
      ...activeCustomer,
      pets: listToSave,
      pet_links: petLinksMap,
    };
    localStorage.setItem('shorttail_active_customer', JSON.stringify(updatedCust));
    setActiveCustomer(updatedCust);

    if (onCustomerUpdate) {
      onCustomerUpdate(updatedCust);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FD] flex flex-col justify-between selection:bg-sky-200 font-sans text-slate-800">
      
      {/* Top Utility Bar */}
      <div className="bg-[#1E5186] text-white text-xs px-4 py-2 border-b border-sky-900/30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Emergency Pet Tag ·{' '}
              <a
                href="https://shorttail.id"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-sky-200 transition-colors"
                title="Website Resmi ShortTail.id"
              >
                ShortTail.id
              </a>
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {onBackToStore && (
              <button
                onClick={onBackToStore}
                className="text-sky-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Toko</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tag Card Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 sm:py-6 flex flex-col items-center">
        
        {/* Toast Notification */}
        {saveToast && (
          <div className="w-full mb-3 bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
            <span>{saveToast}</span>
            <button onClick={() => setSaveToast(null)} className="text-emerald-200 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* Public Direct Viewer Banner (When opened by link without login) */}
        {isPublicViewer && (
          <div className="w-full bg-amber-500/10 border border-amber-400/50 rounded-2xl py-2 px-3.5 text-xs flex items-center justify-between text-amber-950 mb-3 shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="truncate">
                <span className="font-extrabold text-amber-950">Mode Penemu Anabul:</span>{' '}
                <span>Halaman darurat ini dapat diakses langsung tanpa login.</span>
              </div>
            </div>
            {petsList.length > 1 && (
              <button
                onClick={() => setIsPetSelectorModalOpen(true)}
                className="text-[11px] font-extrabold text-amber-900 underline shrink-0 ml-2 cursor-pointer"
              >
                Lihat Anabul Lain
              </button>
            )}
          </div>
        )}

        {/* Logged In Member Sync Banner */}
        {activeCustomer && !isPublicViewer && (
          <div className="w-full bg-emerald-500/10 border border-emerald-400/50 rounded-2xl py-2 px-3.5 text-xs flex items-center justify-between text-emerald-900 mb-3 shadow-2xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-extrabold text-emerald-950">Member:</span>{' '}
                <span className="font-bold">{activeCustomer.name}</span>{' '}
                <span className="font-mono text-emerald-700 text-[11px]">({petsList.length} Anabul)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] font-extrabold text-sky-800 hover:text-sky-950 bg-sky-100/80 hover:bg-sky-200/80 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="Edit foto dan data anabul ini"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-700" />
                <span>Edit Foto/Data</span>
              </button>
              <button
                onClick={() => setIsAddPetModalOpen(true)}
                className="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200/80 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="Tambah anabul lain untuk mendapatkan nomor tag & link permanen baru"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Anabul</span>
              </button>
            </div>
          </div>
        )}

        {/* Multi-Pet Quick Switcher Tabs (If customer has >1 pet) */}
        {petsList.length > 1 && (
          <div className="w-full mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {petsList.map((p, idx) => {
              const isSelected = idx === selectedPetIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPetIndex(idx)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-2xs ${
                    isSelected
                      ? 'bg-[#1E5186] text-white shadow-md'
                      : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>#{p.tag_number}: {p.name}</span>
                </button>
              );
            })}
            {!isPublicViewer && (
              <button
                onClick={() => setIsAddPetModalOpen(true)}
                className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            )}
          </div>
        )}

        {/* Physical Tag Container with Soft Shadow & Border (Matches Uploaded Screenshot) */}
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
            {/* Tag Sequence Badge */}
            <div className="inline-block mb-1 px-2.5 py-0.5 bg-sky-200/60 text-[#1E5186] font-extrabold text-[10px] rounded-full uppercase tracking-wider">
              Smart Pet Tag #{currentPet.tag_number} of {petsList.length}
            </div>

            {/* Cursive Handwriting Header: "Hello, my name is" */}
            <p 
              className="text-2xl sm:text-3xl text-slate-700 tracking-wide mb-1 select-none"
              style={{ fontFamily: "'Caveat', cursive, serif" }}
            >
              {currentPet.subtitle}
            </p>

            {/* Giant Friendly Pet Name */}
            <h1 className="text-5xl sm:text-6xl font-black text-[#5B9BD5] tracking-tight drop-shadow-xs select-none">
              {currentPet.name}
            </h1>
          </div>

          {/* Organic Darker Wavy Mid-Layer containing Pet Photo */}
          <div className="relative mt-1 mb-3">
            
            {/* Background Wavy SVG Layer */}
            <div className="w-full h-48 sm:h-52 bg-gradient-to-b from-[#2E6B9E] via-[#2A6596] to-[#255883] rounded-t-[54px] rounded-b-[54px] flex flex-col items-center justify-center relative shadow-inner overflow-visible">
              
              {/* Center Circular Pet Avatar Container with quick edit overlay for owner */}
              <div className="relative z-20 w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-900 group">
                <img
                  src={currentPet.photoUrl}
                  alt={currentPet.name}
                  className={`w-full h-full object-cover ${
                    currentPet.photoUrl.includes('Screenshot')
                      ? 'scale-[2.2] object-[50%_33%]'
                      : ''
                  }`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to default reference screenshot
                    (e.target as HTMLImageElement).src = '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png';
                  }}
                />
                {!isPublicViewer && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                    title="Klik untuk ubah foto atau data anabul"
                  >
                    <Camera className="w-5 h-5 mb-0.5 drop-shadow-md" />
                    <span className="text-[10px] font-bold drop-shadow-md">Ubah Foto</span>
                  </button>
                )}
              </div>

              {/* Curved SVG Text Path hugging the bottom arc of the Avatar */}
              <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                <svg viewBox="0 0 240 240" className="w-60 h-60 overflow-visible">
                  <path
                    id="pet-curve-path"
                    d="M 28,125 A 92,92 0 0,0 212,125"
                    fill="none"
                  />
                  <text className="fill-white font-bold text-[15px] drop-shadow-md select-none tracking-wide" style={{ fontFamily: "'Caveat', cursive, serif" }}>
                    <textPath href="#pet-curve-path" startOffset="50%" textAnchor="middle">
                      {currentPet.noteText}
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
              title={`Kirim Pesan WhatsApp ke ${effectiveOwnerName}`}
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
                <strong className="font-extrabold text-[#1F497D]">{currentPet.temperamentTitle}</strong>{' '}
                <span className="font-medium text-slate-700">{currentPet.temperamentDesc}</span>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp CTA Button Highlight Card (Sending WhatsApp message to member phone) */}
          <div className="px-5 pb-5 pt-3 relative z-10">
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 border border-sky-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#1E5186]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Kirim Pesan WhatsApp ke Pemilik
                </span>
              </div>

              {/* Primary Direct WhatsApp CTA Button -> Sends message directly to logged in customer phone */}
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
                    <span>Kirim kabar WA ke Pemilik Saya: "Saya Menemukan {currentPet.name}"</span>
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-1">
                {currentPet.enable_gps_sharing && (
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-sky-200">
                    <MapPin className="w-3 h-3 text-sky-600" />
                    <span>One-Time GPS Sharing Aktif</span>
                  </span>
                )}
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  Pesan penemuan {currentPet.name} akan langsung terbuka di WhatsApp nomor pemilik <strong>{effectiveOwnerPhone}</strong>.
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

        {/* Unique Permanent Link Card for this specific Pet */}
        <div className="w-full mt-4 bg-white rounded-2xl p-4 border border-sky-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#1E5186] flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>Link Permanen Unik ({currentPet.name})</span>
            </span>
            <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
              Tag #{currentPet.tag_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentPet.permanent_link}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate outline-none select-all"
            />
            <button
              onClick={() => handleCopyPermanentLink(currentPet.permanent_link)}
              className="py-2 px-3.5 bg-[#1E5186] hover:bg-[#163f68] text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Salin link permanen ini untuk dibuka di browser manapun tanpa login"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            💡 Tautan ini dapat dicetak pada kalung QR Tag atau dibagikan. Siapapun yang membuka tautan ini di browser dapat melihat info <strong>{currentPet.name}</strong> dan menghubungi nomor WhatsApp Anda secara langsung tanpa perlu login.
          </p>
        </div>

        {/* Footer Credit & Official Brand Link */}
        <div className="mt-6 text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleCopyPermanentLink()}
              className="text-[#1E5186] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin Tautan Tag'}</span>
            </button>

            <span className="text-slate-300">·</span>

            <a
              href="https://shorttail.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1E5186] font-semibold hover:underline flex items-center gap-1"
            >
              <span>ShortTail.id Official</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

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

      {/* Multi-Pet Automatic Selection Modal (When customer has more than 1 pet) */}
      {isPetSelectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#1E5186]" />
                  <span>Pilih Anabul</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ditemukan {petsList.length} anabul terdaftar atas nama {effectiveOwnerName}
                </p>
              </div>
              <button
                onClick={() => setIsPetSelectorModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Pilih anabul yang ingin Anda lihat halaman <strong>Lost & Found Tag</strong>-nya. Setiap anabul memiliki halaman dan link permanen unik tersendiri:
            </p>

            {/* List of Customer's Pets */}
            <div className="space-y-2.5">
              {petsList.map((petItem, index) => {
                const isCurrent = index === selectedPetIndex;
                return (
                  <div
                    key={petItem.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-[#1E5186] bg-sky-50/80 shadow-xs ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div 
                      onClick={() => {
                        setSelectedPetIndex(index);
                        setIsPetSelectorModalOpen(false);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-800">
                        <img
                          src={petItem.photoUrl}
                          alt={petItem.name}
                          className={`w-full h-full object-cover ${
                            petItem.photoUrl.includes('Screenshot') ? 'scale-[2.2] object-[50%_33%]' : ''
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-slate-900 truncate">
                            {petItem.name}
                          </span>
                          <span className="text-[10px] font-bold bg-sky-200/70 text-[#1E5186] px-1.5 py-0.2 rounded">
                            Tag #{petItem.tag_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {petItem.temperamentTitle} · {petItem.temperamentDesc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedPetIndex(index);
                          setIsPetSelectorModalOpen(false);
                        }}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-[#1E5186] text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {isCurrent ? 'Aktif' : 'Lihat'}
                      </button>
                      <button
                        onClick={() => handleCopyPermanentLink(petItem.permanent_link)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                        title="Salin Link Permanen Anabul Ini"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isPublicViewer && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPetSelectorModalOpen(false);
                    setIsAddPetModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ Daftarkan Anabul Lain (Dapat Tag #{petsList.length + 1})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Pet Modal */}
      {isAddPetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Tambah Anabul Baru (Tag #{petsList.length + 1})</h3>
                <p className="text-xs text-slate-500">
                  Setiap anabul akan memiliki halaman dan link permanen unik tersendiri
                </p>
              </div>
              <button
                onClick={() => setIsAddPetModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewPet} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Anabul Baru <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Milo, Luna, Choco..."
                  value={newPetForm.name}
                  onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pesan Lengkung di Bawah Foto:</label>
                <input
                  type="text"
                  value={newPetForm.noteText}
                  onChange={(e) => setNewPetForm({ ...newPetForm, noteText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperamen (Bold):</label>
                  <input
                    type="text"
                    value={newPetForm.temperamentTitle}
                    onChange={(e) => setNewPetForm({ ...newPetForm, temperamentTitle: e.target.value })}
                    placeholder="Contoh: Sangat ramah"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan:</label>
                  <input
                    type="text"
                    value={newPetForm.temperamentDesc}
                    onChange={(e) => setNewPetForm({ ...newPetForm, temperamentDesc: e.target.value })}
                    placeholder="Contoh: Suka dielus lembut"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Klinik Hewan & Telp Darurat:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newPetForm.vetName}
                    onChange={(e) => setNewPetForm({ ...newPetForm, vetName: e.target.value })}
                    placeholder="Nama Klinik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={newPetForm.vetPhone}
                    onChange={(e) => setNewPetForm({ ...newPetForm, vetPhone: e.target.value })}
                    placeholder="Telp Klinik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Microchip (Jika Ada):</label>
                <input
                  type="text"
                  value={newPetForm.microchipId}
                  onChange={(e) => setNewPetForm({ ...newPetForm, microchipId: e.target.value })}
                  placeholder="ID-982 000 123 45X"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPet}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingPet && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan & Buat Tag Baru #{petsList.length + 1}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Customize Pet Info Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Atur Profil Tag #{currentPet.tag_number}: {currentPet.name}</h3>
                <p className="text-xs text-slate-500">
                  Data akan tersinkron otomatis ke database Supabase
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              {/* Pet Photo Section */}
              <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100 flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-slate-900 shrink-0">
                  <img
                    src={currentPet.photoUrl}
                    alt={currentPet.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block font-bold text-slate-800 text-xs">Foto Profil Anabul:</label>
                  <div className="flex items-center gap-2">
                    <label className="py-1.5 px-3 bg-[#1E5186] hover:bg-[#163f68] text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Ukuran foto maksimal 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              const updated = [...petsList];
                              updated[selectedPetIndex] = { ...currentPet, photoUrl: base64 };
                              setPetsList(updated);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...petsList];
                        updated[selectedPetIndex] = { 
                          ...currentPet, 
                          photoUrl: '/assets/aistudio/Screenshot_2026-11-08_193920_85dd8fe9.png' 
                        };
                        setPetsList(updated);
                      }}
                      className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                      title="Kembalikan ke foto bawaan"
                    >
                      Reset Default
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Atau tempel URL gambar..."
                    value={currentPet.photoUrl.startsWith('data:') ? 'Foto Lokal (Base64)' : currentPet.photoUrl}
                    onChange={(e) => {
                      if (!e.target.value.startsWith('Foto Lokal')) {
                        const updated = [...petsList];
                        updated[selectedPetIndex] = { ...currentPet, photoUrl: e.target.value };
                        setPetsList(updated);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Anabul:</label>
                <input
                  type="text"
                  value={currentPet.name}
                  onChange={(e) => {
                    const updated = [...petsList];
                    updated[selectedPetIndex] = { ...currentPet, name: e.target.value };
                    setPetsList(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pesan Lengkung di Bawah Foto:</label>
                <input
                  type="text"
                  value={currentPet.noteText}
                  onChange={(e) => {
                    const updated = [...petsList];
                    updated[selectedPetIndex] = { ...currentPet, noteText: e.target.value };
                    setPetsList(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Owner Info (Synced from Member) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pemilik:</label>
                  <input
                    type="text"
                    value={effectiveOwnerName}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. HP / WA Pemilik:</label>
                  <input
                    type="text"
                    value={effectiveOwnerPhone}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              {/* Emergency Contact 2 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Darurat 2 (Sam):</label>
                  <input
                    type="text"
                    value={currentPet.owner2Name}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, owner2Name: e.target.value };
                      setPetsList(updated);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. HP Kontak 2:</label>
                  <input
                    type="text"
                    value={currentPet.owner2Phone}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, owner2Phone: e.target.value };
                      setPetsList(updated);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Vet Clinic */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Klinik Hewan & Telp Darurat:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={currentPet.vetName}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, vetName: e.target.value };
                      setPetsList(updated);
                    }}
                    placeholder="Nama Klinik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={currentPet.vetPhone}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, vetPhone: e.target.value };
                      setPetsList(updated);
                    }}
                    placeholder="Telp Klinik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Temperament Alert */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperamen (Bold):</label>
                  <input
                    type="text"
                    value={currentPet.temperamentTitle}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, temperamentTitle: e.target.value };
                      setPetsList(updated);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan:</label>
                  <input
                    type="text"
                    value={currentPet.temperamentDesc}
                    onChange={(e) => {
                      const updated = [...petsList];
                      updated[selectedPetIndex] = { ...currentPet, temperamentDesc: e.target.value };
                      setPetsList(updated);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Microchip ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Microchip (Jika Ada):</label>
                <input
                  type="text"
                  value={currentPet.microchipId}
                  onChange={(e) => {
                    const updated = [...petsList];
                    updated[selectedPetIndex] = { ...currentPet, microchipId: e.target.value };
                    setPetsList(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Custom WhatsApp Message Template */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-emerald-950 text-xs">
                    Isi Pesan WhatsApp Otomatis (Saat Tombol Diklik):
                  </label>
                  {currentPet.custom_wa_template && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...petsList];
                        updated[selectedPetIndex] = { ...currentPet, custom_wa_template: '' };
                        setPetsList(updated);
                      }}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-semibold cursor-pointer"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={currentPet.custom_wa_template || ''}
                  onChange={(e) => {
                    const updated = [...petsList];
                    updated[selectedPetIndex] = { ...currentPet, custom_wa_template: e.target.value };
                    setPetsList(updated);
                  }}
                  placeholder={`Halo kak [nama_pemilik], saya baru saja menemukan anabul kesayangan Anda yang hilang bernama *[nama_anabul]* (Tag #[tag_number])!\n\nSaat ini [nama_anabul] aman bersama saya. Mohon segera balas pesan ini agar bisa segera dijemput. Terima kasih!`}
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl font-medium text-slate-800 text-xs outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
                <p className="text-[10px] text-emerald-800/80 leading-snug">
                  💡 Gunakan kode otomatis: <strong>[nama_anabul]</strong>, <strong>[nama_pemilik]</strong>, atau <strong>[tag_number]</strong>. Jika dikosongkan, sistem akan memakai pesan standar bawaan.
                </p>
              </div>

              {/* Setting GPS Location Sharing (One-Time Detection Toggle) */}
              <div className="bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200/80 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      currentPet.enable_gps_sharing ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>One-Time GPS Location Sharing</span>
                        {currentPet.enable_gps_sharing ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">AKTIF</span>
                        ) : (
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">NONAKTIF</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Kirim koordinat lokasi penemu 1x bersamaan saat mengklik tombol WhatsApp
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(currentPet.enable_gps_sharing)}
                      onChange={(e) => {
                        const updated = [...petsList];
                        updated[selectedPetIndex] = {
                          ...currentPet,
                          enable_gps_sharing: e.target.checked,
                        };
                        setPetsList(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="pt-1 border-t border-sky-100 text-[10px] text-sky-900/80 leading-relaxed">
                  {currentPet.enable_gps_sharing ? (
                    <span className="text-sky-950 font-medium">
                      ✓ <strong>Fitur aktif khusus anabul ini:</strong> Tombol WhatsApp pada tag kalung akan mendeteksi koordinat Google Maps penemu 1x saat tombol ditekan dan langsung menyertakannya dalam pesan WhatsApp.
                    </span>
                  ) : (
                    <span>
                      Fitur dinonaktifkan untuk anabul ini (hanya pesan teks standar tanpa tautan koordinat lokasi GPS).
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSavePetChanges}
                disabled={isSavingPet}
                className="w-full py-2.5 bg-[#1E5186] hover:bg-[#18426d] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingPet && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan & Sinkronkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
