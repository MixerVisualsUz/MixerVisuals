import { useState } from 'react';
import { FileText, Lock, RotateCcw, BookOpen, HelpCircle, Scale } from 'lucide-react';
import { Card } from './ui';

const docs = [
  {
    id: 'terms',
    title: 'Foydalanuvchi shartnomasi',
    updated: '15.04.2024',
    icon: FileText,
    content: [
      { h: '1. Umumiy qoidalar', p: 'Ushbu foydalanuvchi shartnomasi (bundan keyin "Shartnoma") Mixer Visuals platformasidan foydalanish shart-shartlarini belgilaydi. Platformadan foydalanish orqali siz shartnoma shartlarini qabul qilasiz.' },
      { h: '2. Xizmat tavsifi', p: 'Mixer Visuals — Minecraft o‘yini uchun yordamchi dastur (helper). Xizmat obuna asosida taqdim etiladi va faqat shaxsiy, kommersiya bo‘lmagan maqsadlarda foydalanish uchun mo‘ljallangan.' },
      { h: '3. Foydalanuvchi majburiyatlari', p: 'Foydalanuvchi o‘z hisob ma‘lumotlarini xavfsiz saqlash, parolni uchinchi shaxslarga bermaslik va platformadan qonuniy maqsadlarda foydalanish majburiyatini oladi.' },
      { h: '4. Obuna va to‘lov', p: 'Obuna to‘lov qilinganidan keyin faollashtiriladi. To‘lovlar chek orqali tasdiqlanadi va 24 soat ichida ko‘rib chiqiladi. To‘lov qaytarib berilmaydi, agar texnik nosozlik bo‘lmasa.' },
      { h: '5. Litsenziya', p: 'Har bir litsenziya bitta qurilma (HWID) ga bog‘lanadi. Litsenziyani boshqa qurilmaga ko‘chirish faqat administrator ruxsati bilan mumkin.' },
      { h: '6. Mas‘uliyatni cheklash', p: 'Mixer Visuals o‘yin ichidagi akkaunt bloklanishi yoki boshqa o‘yin serverlari tomonidan qo‘yiladigan cheklovlardan mas‘ul emas.' },
      { h: '7. Shartnoma o‘zgartirishlari', p: 'Administrator shartnomani istalgan vaqtda o‘zgartirish huquqini saqlab qoladi. O‘zgartirishlar e‘lon qilingandan keyin kuchga kiradi.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Maxfiylik siyosati',
    updated: '15.04.2024',
    icon: Lock,
    content: [
      { h: '1. Yig‘iladigan ma‘lumotlar', p: 'Biz email manzilingiz, foydalanuvchi nomi, HWID kodi va to‘lov tarixi kabi ma‘lumotlarni yig‘amiz. Bu ma‘lumotlar xizmatni taqdim etish uchun ishlatiladi.' },
      { h: '2. Ma‘lumotlardan foydalanish', p: 'Yig‘ilgan ma‘lumotlar faqat xizmatni ko‘rsatish, texnik yordam berish va hisob xavfsizligini ta‘minlash uchun ishlatiladi. Ma‘lumotlar uchinchi shaxslarga sotilmaydi.' },
      { h: '3. Ma‘lumotlar xavfsizligi', p: 'Barcha ma‘lumotlar shifrlangan holda saqlanadi va zamonaviy xavfsizlik standartlariga muvofiq himoyalangan.' },
      { h: '4. Cookie va texnologiyalar', p: 'Biz sessiyani saqlash va xizmatni yaxshilash uchun cookie va shu kabi texnologiyalardan foydalanamiz.' },
      { h: '5. Foydalanuvchi huquqlari', p: 'Siz o‘z ma‘lumotlaringizni ko‘rish, tuzatish yoki o‘chirishni so‘rash huquqiga egasiz. Buning uchun texnik yordamga murojaat qiling.' },
    ],
  },
  {
    id: 'refund',
    title: 'Qaytarish siyosati',
    updated: '15.04.2024',
    icon: RotateCcw,
    content: [
      { h: '1. Umumiy qoida', p: 'Obuna to‘lovlari odatda qaytarib berilmaydi, chunki xizmat raqamli mahsulot hisoblanadi va darhol yetkazib beriladi.' },
      { h: '2. Texnik nosozlik holati', p: 'Agar xizmat texnik sabablarga ko‘ra ishlamasa va biz tomonidan 72 soat ichida tuzatilmagan bo‘lsa, to‘lov qaytarib berilishi mumkin.' },
      { h: '3. Qaytarish jarayoni', p: 'Qaytarish so‘rovi Telegram orqali texnik yordamga yuboriladi. So‘rov 5 ish kuni ichida ko‘rib chiqiladi.' },
      { h: '4. Istisnolar', p: 'Foydalanuvchi shartnomani buzgan holatlarda (litsenziyani uchinchi shaxsga sotish, anti-cheat qoidalarini buzish) qaytarish amalga oshirilmaydi.' },
    ],
  },
  {
    id: 'guide',
    title: 'Foydalanish qo‘llanmasi',
    updated: '28.07.2026',
    icon: BookOpen,
    content: [
      { h: '1. Ro‘yxatdan o‘tish', p: 'Saytning o‘ng yuqori burchakidagi "Kirish" tugmasini bosing va "Ro‘yxatdan o‘tish" tabiga o‘ting. Email, foydalanuvchi nomi va parolni kiriting.' },
      { h: '2. Obuna sotib olish', p: 'Kabinetda "Narxlar" bo‘limiga o‘ting. O‘zingizga mos paketni tanlang (30, 60, 90 yoki 180 kun). Promokod bilan chegirma olishingiz mumkin.' },
      { h: '3. To‘lov qilish', p: 'Humo karta raqamiga to‘lov qiling. Chek rasmini yuklang va "To‘lovni tasdiqlash" tugmasini bosing. Admin 24 soat ichida tasdiqlaydi.' },
      { h: '4. Modga kirish', p: 'Obuna faollashgach, modni yuklab oling. Modning kirish oynasida email va parolingizni kiriting — HWID avtomatik bog‘lanadi.' },
      { h: '5. Kalit faollashtirish', p: 'Agar sizda litsenziya kaliti bo‘lsa, uni "Kalit faollashtirish" bo‘limida kiriting. Obuna avtomatik faollashtiriladi.' },
      { h: '6. Referal tizimi', p: 'Referal bo‘limida o‘zingizning referal linkingizni oling. Do‘stlaringizga ulashing va har bir faol obunadan 20% daromad oling.' },
    ],
  },
  {
    id: 'faq',
    title: 'Tez-tez so‘raladigan savollar',
    updated: '28.07.2026',
    icon: HelpCircle,
    content: [
      { h: 'Mixer Visuals xavfsizmi?', p: 'Ha, bizning dasturimiz anti-cheat tizimlardan to‘liq himoyalangan. Akkauntingiz xavfsizligi biz uchun birinchi o‘rinda turadi.' },
      { h: 'Obuna qanday faollashtiriladi?', p: 'To‘lov qilgach, chek rasmini yuklang. Admin 24 soat ichida tekshirib, obunangizni faollashtiradi.' },
      { h: 'HWID nima va nima uchun kerak?', p: 'HWID — qurilma identifikatori. Obunangiz faqat bir qurilmada ishlaydi, bu xavfsizlik uchun kerak.' },
      { h: 'Promokod qanday ishlatiladi?', p: 'To‘lov sahifasida promokodni kiriting va "Tekshirish" tugmasini bosing. Chegirma avtomatik hisoblanadi.' },
      { h: 'Qaysi paketni tanlashim kerak?', p: '180 kunlik paket eng foydali — eng uzoq muddat va eng yaxshi narx. Boshlang‘ich uchun 30 kunlik tavsiya etiladi.' },
      { h: 'Obunani uzaytirish mumkinmi?', p: 'Ha, yangi obuna sotib olsangiz, qolgan kunlar yangi obunaga qo‘shiladi.' },
    ],
  },
  {
    id: 'rules',
    title: 'Foydalanish qoidalari',
    updated: '01.07.2026',
    icon: Scale,
    content: [
      { h: '1. Umumiy qoidalar', p: 'Mixer Visuals dan foydalanishda quyidagi qoidalarga rioya qilish majburiydir. Qoidalarni buzish obunaning bekor qilinishiga olib keladi.' },
      { h: '2. Litsenziya ulashish', p: 'Litsenziyani uchinchi shaxsga sotish, ulashish yoki ijaraga berish qattiq taqiqlanadi. HWID himoyasi buni nazorat qiladi.' },
      { h: '3. Hujum qilish', p: 'Dastur yoki serverga hujum qilish, DDoS hujumlari yoki boshqa zararli harakatlar taqiqlanadi.' },
      { h: '4. Soxta to‘lov', p: 'Soxta chek yoki manipulyatsiya qilingan to‘lov ma‘lumotlarini yuborish hisobni bloklashga olib keladi.' },
      { h: '5. O‘zgartirishlar', p: 'Dastur kodini o‘zgartirish, dekompilyatsiya qilish yoki teskari muhandislik taqiqlanadi.' },
      { h: '6. Jazo chorasi', p: 'Qoidalarni buzgan foydalanuvchilar ogohlantirishsiz bloklanadi va to‘lovlari qaytarib berilmaydi.' },
    ],
  },
];

export function Documents() {
  const [active, setActive] = useState('terms');
  const doc = docs.find((d) => d.id === active)!;

  return (
    <div className="pt-24 pb-20 px-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <FileText size={24} className="text-[#ffffff]" />
        <h1 className="text-2xl font-bold text-white">Hujjatlar</h1>
      </div>
      <p className="text-zinc-500 mb-8">Foydalanuvchi shartnomasi (Oxirgi yangilanish: {doc.updated})</p>

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                active === d.id
                  ? 'bg-[#ffffff]/10 border border-[#ffffff]/25 text-[#ffffff]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <d.icon size={16} /> {d.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center">
              <doc.icon size={18} className="text-[#ffffff]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{doc.title}</h2>
              <p className="text-xs text-zinc-500">Oxirgi yangilanish: {doc.updated}</p>
            </div>
          </div>
          <div className="space-y-6">
            {doc.content.map((s, i) => (
              <div key={i}>
                <h3 className="text-white font-semibold mb-1.5">{s.h}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.p}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
