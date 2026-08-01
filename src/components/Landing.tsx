import { useState } from 'react';
import {
  ArrowRight, Check, Sparkles, Search, Maximize,
  Sun, Zap, Shield, Fingerprint, RefreshCw,
  Users, Trophy, Cpu, Layers, Gauge,
  Star, Download, Monitor, CreditCard,
} from 'lucide-react';
import { useNav } from '../context/NavContext';
import { Button, Card, Badge } from '../components/ui';

const stats = [
  { value: '5000+', label: 'Faol foydalanuvchi' },
  { value: '99.9%', label: 'Uptime kafolati' },
  { value: '24/7', label: 'Texnik yordam' },
  { value: '150+', label: 'FPS o‘sishi' },
];

const features = [
  { icon: Zap, title: 'Tez ishlaydi', desc: 'Yuqori FPS va minimal ping ta‘sirida ishlaydi. Hech qanday lagg yo‘q.' },
  { icon: Sun, title: 'Full Bright', desc: 'Qorong‘u joylarda ham hammasini yorug‘ va aniq ko‘ring.' },
  { icon: Shield, title: 'Xavfsiz & Ishonchli', desc: 'Barqaror ishlaydi, akkauntingiz va ma’lumotlaringiz himoyalangan.' },
  { icon: RefreshCw, title: '24/7 Yangilanadi', desc: 'O‘yin yangilanishi bilan bir vaqtda yangilanadi.' },
  { icon: Fingerprint, title: 'HWID Himoya', desc: 'Har bir litsenziya qurilmangizga bog‘langan.' },
  { icon: Users, title: 'Faol Jamiyat', desc: 'Ko‘p ming foydalanuvchi bilan birgalikda yaxshilanadi.' },
];

const advancedFeatures = [
  { icon: Sparkles, title: 'Shader Yordami', desc: 'Realistik yorug‘lik, soyalar va suv effektlari bilan o‘yin chiroyli ko‘rinadi.' },
  { icon: Sun, title: 'Skybox Sozlamalari', desc: 'Osmon, quyosh va bulutlarni o‘zingizga moslab sozlang.' },
  { icon: Maximize, title: 'FOV Boshqaruvi', desc: 'Ko‘rish burchagini o‘zingizga qulay darajada sozlang.' },
  { icon: Search, title: 'Zoom', desc: 'Masofadagi detallarni silliq yaqinlashtirib ko‘ring.' },
  { icon: Gauge, title: 'FPS Optimizer', desc: 'O‘yin FPS-ni avtomatik optimallashtirish va stabilizatsiya.' },
  { icon: Layers, title: 'Grafik Sifati', desc: 'Render masofasi va grafik sozlamalarini to‘liq boshqaring.' },
];

const testimonials = [
  { name: 'Aziz K.', text: 'Mixer Visuals meni o‘yin tajribamni butunlay o‘zgartirdi. Endi doim g‘alaba qozonaman!', rating: 5 },
  { name: 'Jasur M.', text: 'Eng yaxshi visual mod. O‘yin endi juda chiroyli va silliq ishlaydi, FPS sezilarli oshdi.', rating: 5 },
  { name: 'Dilshod R.', text: 'Tez, ishonchli va arzon. 180 kunlik obuna eng yaxshi narx.', rating: 5 },
  { name: 'Sardor N.', text: 'Admin panel ajoyib, promokodlar bilan chegirma olish juda oson.', rating: 5 },
];

const faqs = [
  { q: 'Mixer Visuals xavfsizmi?', a: 'Ha, dasturimiz xavfsiz va barqaror ishlaydi. O‘yiningiz hech qanday xavf ostida emas, akkauntingiz himoyalangan.' },
  { q: 'Obuna qanday faollashtiriladi?', a: 'To‘lov qilgach, chek rasmini yuklang. Admin 24 soat ichida tekshirib, obunangizni faollashtiradi.' },
  { q: 'HWID nima va nima uchun kerak?', a: 'HWID — qurilma identifikatori. Obunangiz faqat bir qurilmada ishlaydi, bu xavfsizlik uchun kerak.' },
  { q: 'Promokod qanday ishlatiladi?', a: 'To‘lov sahifasida promokodni kiriting va "Tekshirish" tugmasini bosing. Chegirma avtomatik hisoblanadi.' },
  { q: 'Qaysi paketni tanlashim kerak?', a: '180 kunlik paket eng foydali — eng uzoq muddat va eng yaxshi narx. Boshlang‘ich uchun 30 kunlik tavsiya etiladi.' },
];

const changelog = [
  { version: 'v2.4.0', date: '28.07.2026', changes: ['Yangi shader paketlari qo‘shildi', 'FPS optimizatsiyasi yaxshilandi', 'HWID tizimi yangilandi'] },
  { version: 'v2.3.0', date: '15.07.2026', changes: ['Skybox sozlamalari qo‘shildi', 'Promokod tizimi ishga tushdi', 'Bir nechta xato tuzatildi'] },
  { version: 'v2.2.0', date: '01.07.2026', changes: ['FOV boshqaruvi qo‘shildi', 'Zoom funksiyasi yangilandi', 'UI yangilandi'] },
];

export function Landing({ onKabinet }: { onKabinet: () => void }) {
  const { navigate } = useNav();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="relative">
      {/* HERO */}
      <section id="hero" className="min-h-screen flex flex-col items-center justify-center px-5 pt-20 pb-12 relative">
        <div className="animate-[fadeIn_0.6s_ease-out_both]">
          <Badge color="gold">
            <Sparkles size={12} /> O‘zbekiston #1 gaming helper
          </Badge>
        </div>
        <h1 className="mt-6 text-center text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl animate-[fadeIn_0.7s_ease-out_100ms_both]">
          <span className="text-white">Mixer Visuals</span>{' '}
          <span className="block sm:inline mt-2 sm:mt-0 text-zinc-400 text-3xl sm:text-5xl md:text-6xl font-bold">— chiroyli grafik, yuqori FPS</span>
        </h1>
        <p className="mt-6 text-center text-base sm:text-lg text-zinc-400 max-w-2xl animate-[fadeIn_0.7s_ease-out_200ms_both]">
          Kuchli visual mod — o‘yiningizni chiroyli va silliq qiladi. Yuqori FPS, qulay sozlamalar
          va professional grafik ko‘rinish bilan o‘yin tajribangizni yangi bosqichga olib chiqing.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-[fadeIn_0.7s_ease-out_300ms_both]">
          <Button size="lg" onClick={onKabinet}>
            Hoziroq boshlash <ArrowRight size={18} />
          </Button>
          <Button size="lg" variant="secondary" onClick={() => document.getElementById('hud')?.scrollIntoView({ behavior: 'smooth' })}>
            Funksiyalarni ko‘rish
          </Button>
        </div>

        {/* HUD Preview */}
        <div id="hud" className="mt-16 w-full max-w-4xl scroll-mt-24 animate-[fadeIn_0.8s_ease-out_400ms_both]">
          <div className="rounded-2xl overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <img
              src="/gui/new.png"
              alt="Mixer Visuals interfeysi"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={s.label} className={`p-6 text-center ${i === 3 ? 'border-[#ffffff]/30' : ''}`}>
              <div className={`text-3xl sm:text-4xl font-bold ${i === 3 ? 'gold-text' : 'text-white'}`}>
                {s.value}
              </div>
              <div className="mt-2 text-sm text-zinc-500">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-5 py-20 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center mb-12 animate-[fadeIn_0.6s_ease-out_both]">
          <Badge color="gold">Dastur haqida</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">Mixer Visuals nima?</h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Mixer Visuals — Minecraft o‘yinchilari uchun yaratilgan premium yordamchi dastur. U o‘yin
            tajribangizni sezilarli darajada yaxshilaydi, xavfsiz va ishonchli muhitda o‘ynash imkonini beradi.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 animate-[slideInLeft_0.6s_ease-out_both]">
            <Badge color="gold"><Check size={12} /> Xavfsiz</Badge>
            <h3 className="mt-4 text-2xl font-bold text-white">Ishonchlilik kafolati</h3>
            <p className="mt-3 text-zinc-400">
              Dastur barqaror va xavfsiz ishlaydi. Akkauntingiz va ma’lumotlaringiz himoyalangan,
              tizimga hech qanday zarar yetmaydi.
            </p>
          </Card>
          <Card className="p-8 animate-[slideInRight_0.6s_ease-out_both]">
            <Badge color="gold"><RefreshCw size={12} /> Yangilanadi</Badge>
            <h3 className="mt-4 text-2xl font-bold text-white">Doimiy rivojlanish</h3>
            <p className="mt-3 text-zinc-400">
              O‘yin yangilanishi chiqishi bilan bir vaqtda biz ham yangilanamiz. Doim yangi imkoniyatlar va
              optimallashtirishlar bilan xizmat qilamiz.
            </p>
          </Card>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-5 py-20 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center mb-12">
          <Badge color="gold">Afzalliklari</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">Nima uchun Mixer Visuals?</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card key={f.title} className={`p-6 animate-[fadeIn_0.5s_ease-out_${i * 80}ms_both]`}>
              <div className="w-11 h-11 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-[#ffffff]" />
              </div>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ADVANCED FEATURES */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge color="gold"><Cpu size={12} /> Ilg‘or funksiyalar</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">Professional imkoniyatlar</h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Har bir funksiya professional o‘yinchilar uchun mo‘ljallangan. Yuqori darajadagi nazorat va aniqlik.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {advancedFeatures.map((f, i) => (
            <Card key={f.title} className={`p-6 animate-[fadeIn_0.5s_ease-out_${i * 80}ms_both]`}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-[#ffffff]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge color="gold">Qanday ishlaydi</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">3 oddiy qadam</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { num: '01', icon: Download, title: 'Ro‘yxatdan o‘ting', desc: 'Email va parol bilan hisob yarating. Bu juda tez va oson.' },
            { num: '02', icon: CreditCard, title: 'Obuna tanlang', desc: 'O‘zingizga mos paketni tanlang va to‘lov qiling. Promokod bilan chegirma oling.' },
            { num: '03', icon: Monitor, title: 'Foydalaning', desc: 'Modga kiring — HWID avtomatik bog‘lanadi. G‘alaba sizniki!' },
          ].map((step, i) => (
            <Card key={step.num} className={`p-8 relative animate-[fadeIn_0.5s_ease-out_${i * 120}ms_both]`}>
              <div className="absolute top-4 right-5 text-5xl font-extrabold text-[#ffffff]/10">{step.num}</div>
              <div className="w-12 h-12 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center mb-4">
                <step.icon size={22} className="text-[#ffffff]" />
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-5 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge color="gold"><Trophy size={12} /> Sharhlar</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">Foydalanuvchilar nima deydi?</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <Card key={t.name} className={`p-6 animate-[fadeIn_0.5s_ease-out_${i * 80}ms_both]`}>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-[#ffffff] fill-[#ffffff]" />
                ))}
              </div>
              <p className="text-zinc-300 leading-relaxed">"{t.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffffff]/15 border border-[#ffffff]/25 flex items-center justify-center text-[#ffffff] font-bold">
                  {t.name[0]}
                </div>
                <span className="text-white font-medium">{t.name}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CHANGELOG */}
      <section className="px-5 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge color="gold"><RefreshCw size={12} /> Yangilanishlar</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">O‘zgarishlar tarixi</h2>
        </div>
        <div className="space-y-4">
          {changelog.map((log, i) => (
            <Card key={log.version} className={`p-6 animate-[slideInLeft_0.5s_ease-out_${i * 100}ms_both]`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-[#ffffff]/15 text-[#ffffff] text-sm font-mono font-medium border border-[#ffffff]/25">
                    {log.version}
                  </span>
                  <span className="text-sm text-zinc-500">{log.date}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {log.changes.map((c, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-[#ffffff] mt-0.5 shrink-0" /> {c}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge color="gold">Savol-javob</Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white">Tez-tez so‘raladigan savollar</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Card key={i} className="overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-white font-medium">{f.q}</span>
                <span className={`text-[#ffffff] text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed animate-[fadeIn_0.3s_ease-out]">
                  {f.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ffffff]/10 via-[#ffffff]/5 to-transparent border border-[#ffffff]/25 p-10 sm:p-16 text-center shadow-[0_0_60px_rgba(255,255,255,0.1)]">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#ffffff]/15 rounded-full blur-3xl animate-[glowPulse_4s_ease-in-out_infinite]" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#ffffff]/10 rounded-full blur-3xl animate-[glowPulse_5s_ease-in-out_infinite_reverse]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Tayyor bo‘ldingizmi?</h2>
            <p className="mt-4 text-zinc-300 max-w-xl mx-auto">
              Ro‘yxatdan o‘ting va o‘yiningizni yangi darajaga olib chiqing.
            </p>
            <Button size="lg" className="mt-8" onClick={() => navigate({ name: 'dashboard', view: 'pricing' })}>
              Sotib olish <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-10 border-t border-[#ffffff]/10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.png" alt="Mixer Visuals" className="w-6 h-6 rounded" />
          <span className="font-semibold text-white">Mixer Visuals</span>
        </div>
        <p className="text-sm text-zinc-600">Mixer Visuals &copy; 2026 — Barcha huquqlar himoyalangan</p>
      </footer>
    </div>
  );
}
