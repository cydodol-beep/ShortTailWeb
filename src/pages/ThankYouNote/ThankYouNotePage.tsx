import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Heart, 
  ShieldCheck, 
  Award, 
  Gift, 
  MessageCircle, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Copy,
  Check
} from 'lucide-react';

interface ThankYouNotePageProps {
  onBackToStore?: () => void;
  brandName?: string;
  storeLogo?: string | null;
}

export const ThankYouNotePage: React.FC<ThankYouNotePageProps> = ({
  onBackToStore,
  brandName = 'ShortTail.id',
  storeLogo,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const heroImage = '/src/assets/images/thankyou_anabul_hero_1794013500443.jpg';

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://shorttail.id');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* =========================================================================
            1. HEADER SECTION
            - Logo Placeholder / Brand Name (ShortTail.id)
            - Headline Utama yang singkat, hangat, dan berkesan
           ========================================================================= */}
        <header className="text-center space-y-6">
          {/* Logo Lockup */}
          <div className="inline-flex items-center gap-3">
            <a
              href="https://shorttail.id"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center bg-transparent shrink-0 hover:opacity-85 transition-opacity"
              title="Kunjungi Website Resmi ShortTail.id"
            >
              {storeLogo ? (
                <img 
                  src={storeLogo} 
                  alt={brandName} 
                  className="w-full h-full object-contain bg-transparent"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl border-2 border-emerald-600 text-emerald-700 flex items-center justify-center font-black text-lg tracking-tight bg-transparent">
                  ST
                </div>
              )}
            </a>
            <div className="text-left">
              <a
                href="https://shorttail.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 hover:text-emerald-700 transition-colors block font-sans"
                title="Kunjungi Website Resmi ShortTail.id"
              >
                {brandName}
              </a>
              <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase block">
                Healthy Treats for Every Anabul
              </span>
            </div>
          </div>

          {/* Headline Utama */}
          <div className="space-y-3 max-w-2xl mx-auto pt-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              Terima Kasih Telah Mempercayakan Camilan dan Pet Goods Terbaik untuk Anabul Tercinta.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Momen bahagia mereka adalah alasan terbesar kami terus berdedikasi menghadirkan camilan alami berkualitas tinggi.
            </p>
          </div>

          {/* Hero Photography Asset */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 aspect-16/9 bg-slate-200 group">
            <img
              src={heroImage}
              alt="Anabul bahagia bersama camilan dan pet goods sehat ShortTail.id"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback styled container if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-left text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
                  Komitmen Kasih Sayang
                </p>
                <p className="text-sm sm:text-lg font-bold">
                  Diformulasikan untuk Kucing & Anjing Sehat Indonesia
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                100% Real Love
              </span>
            </div>
          </div>
        </header>

        {/* =========================================================================
            2. BODY SECTION (Thank You Note - Singkat & Padat)
            - 2-3 kalimat apresiasi atas pembelian mereka
            - Penjelasan singkat tentang komitmen kualitas produk/layanan shorttail.id
           ========================================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-widest">
              <Award className="w-4 h-4" />
              <span>Surat Apresiasi Resmi</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              <a
                href="https://shorttail.id"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-700 underline transition-colors"
                title="Kunjungi Website Resmi ShortTail.id"
              >
                ShortTail.id
              </a>{' '}
              · Authentic Care
            </span>
          </div>

          <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
            <p className="font-semibold text-slate-900 text-base sm:text-lg">
              Setiap paket yang sampai ke pintu rumah Anda bukan sekadar pesanan camilan, melainkan wujud cinta tulus bagi anggota keluarga berbulu Anda.
            </p>
            <p>
              Kami sangat mengapresiasi dan berterima kasih atas kepercayaan Anda telah memilih{' '}
              <a
                href="https://shorttail.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 font-bold underline decoration-emerald-500 hover:text-emerald-700 transition-colors"
                title="Kunjungi Website Resmi ShortTail.id"
              >
                ShortTail.id
              </a>{' '}
              sebagai mitra camilan dan pet goods anabul kesayangan. Kepercayaan Anda memotivasi kami untuk selalu menjaga integritas dari hulu hingga ke mangkuk makan mereka.
            </p>
            <p>
              Seluruh varian produk kami diproses dengan standar higienis yang ketat, memanfaatkan <strong className="text-emerald-800 font-bold">100% daging asli & bahan alami tanpa bahan pengawet sintetik</strong>, perasa artifisial, maupun pewarna kimia berbahaya. Setiap potongan disiapkan agar anabul tetap lincah, berbulu indah, dan berumur panjang dalam kesehatan optimal.
            </p>
          </div>

          {/* Visual Trust Callout with Product Feature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">100% Bahan Alami</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Daging murni tanpa filler berbahaya atau garam berlebih.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Teknologi Dehydrated</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Kelezatan camilan, pet goods, dan vitamin alami terkunci sempurna.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Higienis & Fresh Batch</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Diproduksi berkala dengan standar sanitasi tertinggi.</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. HOOK / VALUE PROPOSITION SECTION (Special Reorder Promo)
           ========================================================================= */}
        <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700/60">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>Khusus Pelanggan Reorder</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Ready for Another Special Promo?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Dapatkan promo spesial tambahan khusus untuk Anda yang melakukan reorder langsung melalui official web{' '}
              <a
                href="https://shorttail.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 font-semibold underline hover:text-white transition-colors"
                title="Kunjungi Website Resmi ShortTail.id"
              >
                ShortTail.id
              </a>
              . Nikmati kesempatan mendapatkan potongan harga, gratis ongkir (khusus JaBoDeTaBek), hingga free sample produk terbaru (apabila ada) untuk anabul kesayangan. S&K Berlaku
            </p>
          </div>
        </section>

        {/* =========================================================================
            4. CALL TO ACTION (CTA) BUTTON SECTION
            - Tombol utama yang menonjol dan jelas
            - Teks tombol (CTA Copy) persuasif dan singkat
            - URL target: https://shorttail.id
           ========================================================================= */}
        <section className="text-center space-y-6 pt-4">
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Langkah Selanjutnya
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Siap Manjakan Anabul dengan Penawaran Terbaik?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Klik tombol di bawah ini untuk menjelajahi katalog lengkap dan nikmati penawaran khusus di website resmi kami.
            </p>
          </div>

          {/* Primary CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <a
              href="https://shorttail.id"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group"
            >
              <span>Kunjungi Website Resmi ShortTail.id</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Salin tautan resmi https://shorttail.id"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copiedLink ? 'Link Tersalin!' : 'Salin URL'}</span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            5. FOOTER SECTION
            - Informasi layanan pelanggan / dukungan singkat ("Butuh bantuan? Hubungi kami")
           ========================================================================= */}
        <footer className="border-t border-slate-200 pt-8 mt-12 text-slate-500 text-xs space-y-6">
          <div className="bg-slate-100/80 rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Butuh Bantuan atau Konsultasi Camilan dan Pet Goods Anabul?</span>
              </h4>
              <p className="text-slate-600 text-xs">
                Tim Customer Care kami siap membantu dengan senang hati untuk setiap pertanyaan produk, takaran saji, maupun pengiriman.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <a
                href="https://wa.me/6287888177362?text=Halo%20tim%20ShortTail.id,%20saya%20ingin%20tanya%20seputar%20produk%20dan%20pesanan%20saya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat WhatsApp Admin</span>
              </a>

              <a
                href="mailto:shorttail.id@gmail.com"
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>shorttail.id@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Operational Hours & Legal Details */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Jam Layanan: Senin – Minggu, 08:00 – 21:00 WIB</span>
            </div>

            <div className="flex items-center space-x-4">
              <span>
                &copy; {new Date().getFullYear()}{' '}
                <a
                  href="https://shorttail.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                  title="Kunjungi Website Resmi ShortTail.id"
                >
                  ShortTail.id
                </a>{' '}
                · All rights reserved.
              </span>
              <a 
                href="https://shorttail.id" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-emerald-700 hover:underline font-semibold"
                title="Kunjungi Website Resmi ShortTail.id"
              >
                ShortTail.id
              </a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};
