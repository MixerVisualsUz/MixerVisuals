import { useState, useEffect } from 'react';
import {
  Shield, CreditCard, KeyRound, Fingerprint, Clock, Calendar, Check, AlertCircle,
  ArrowLeft, Upload, MessageCircle, Users, Gift, Cloud, Link2, Tag, X, Download,
  Timer, Ticket, PartyPopper,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, Input, Spinner, CopyButton } from './ui';
import { supabase } from '../lib/supabase';
import { PLANS, formatPrice, planByCode } from '../lib/plans';
import { TELEGRAM_SUPPORT, HUMO_CARD, HUMO_OWNER, SITE_DOMAIN, DOWNLOAD_URL, DOWNLOAD_VERSION } from '../lib/constants';
import type { Payment } from '../lib/types';

type DashView = 'panel' | 'pricing' | 'payment' | 'referral' | 'ecosystem' | 'bonus';

export function Dashboard({ initialView = 'panel' }: { initialView?: DashView }) {
  const { profile, signOut, refreshProfile } = useAuth();
  const [view, setView] = useState<DashView>(initialView);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  if (!profile) return null;

  const openPayment = (code: string) => {
    setSelectedPlan(code);
    setView('payment');
  };

  if (view === 'pricing') {
    return (
      <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Sotib olish</h1>
        <PricingView onBuy={openPayment} />
      </div>
    );
  }

  if (view === 'payment' && selectedPlan) {
    return (
      <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
        <PaymentView planCode={selectedPlan} onBack={() => setView('pricing')} onPaid={refreshProfile} />
      </div>
    );
  }

  const tabs: { id: DashView; label: string }[] = [
    { id: 'panel', label: 'Panel' },
    { id: 'referral', label: 'Referal' },
    { id: 'ecosystem', label: 'Configlar' },
    { id: 'bonus', label: 'Bonus' },
  ];

  return (
    <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Hisob</h1>
          <p className="text-sm text-zinc-500 mt-1">Xush kelibsiz, {profile.username}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 hidden sm:block">{profile.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <Shield size={16} /> Chiqish
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
              view === t.id ? 'bg-gradient-to-r from-[#ffffff] to-[#ffffff] text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'panel' && <PanelView onBuy={() => setView('pricing')} />}
      {view === 'referral' && <ReferralView />}
      {view === 'ecosystem' && <EcosystemView />}
      {view === 'bonus' && <BonusView />}
    </div>
  );
}

// ============ PANEL ============
function PanelView({ onBuy }: { onBuy: () => void }) {
  const { profile } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [keyMsg, setKeyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('payments')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setPayments((data as Payment[]) || []));
  }, [profile]);

  if (!profile) return null;

  const hasSub = !!profile.subscription_plan;
  const expires = profile.subscription_expires;
  const daysLeft = !hasSub ? 0 : expires ? Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000)) : 0;

  const activateKey = async () => {
    if (!keyInput.trim()) { setKeyMsg({ type: 'err', text: 'Kalit kodini kiriting' }); return; }
    setKeyLoading(true);
    const code = keyInput.trim().toUpperCase();
    const { data: res, error } = await supabase.rpc('activate_key', { p_code: code });
    setKeyLoading(false);
    if (error) { setKeyMsg({ type: 'err', text: 'Xatolik: ' + error.message }); return; }
    const r = res as { ok?: boolean; error?: string; plan?: string; expires?: string | null };
    if (!r.ok) { setKeyMsg({ type: 'err', text: r.error || 'Kalit faollashtirilmadi' }); return; }
    setKeyMsg({ type: 'ok', text: 'Kalit muvaffaqiyatli faollashtirildi!' });
    setKeyInput('');
    await refreshProfile();
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center">
              <CreditCard size={18} className="text-[#ffffff]" />
            </div>
            {hasSub ? <Badge color="gold"><Check size={12} /> Faol</Badge> : <Badge color="red">Obuna yo‘q</Badge>}
          </div>
          <div className="text-sm text-zinc-500">Obuna holati</div>
          <div className="text-lg font-semibold text-white mt-1">{hasSub ? planByCode(profile.subscription_plan || '')?.name || profile.subscription_plan : 'Faol emas'}</div>
        </Card>
        <Card className="p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Clock size={18} className="text-blue-400" />
          </div>
          <div className="text-sm text-zinc-500">Qolgan kunlar</div>
          <div className="text-lg font-semibold text-white mt-1">{hasSub ? `${daysLeft} kun` : '—'}</div>
        </Card>
        <Card className="p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
            <Calendar size={18} className="text-amber-400" />
          </div>
          <div className="text-sm text-zinc-500">Tugash sanasi</div>
          <div className="text-lg font-semibold text-white mt-1">{hasSub ? expires : '—'}</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Download size={20} className="text-[#ffffff]" />
          <h3 className="text-lg font-semibold text-white">Yuklab olish</h3>
        </div>
        {hasSub ? (
          <>
            <p className="text-sm text-zinc-400 mb-4">Obunangiz faol! Mixer Visuals launcherini yuklab oling, o‘rnating va o‘yingizni chiroyli qiling.</p>
            <a href={DOWNLOAD_URL} download="MixerVisualsLauncher.exe" className="block">
              <Button size="lg" className="w-full sm:w-auto"><Download size={16} /> Launcher yuklab olish {DOWNLOAD_VERSION}</Button>
            </a>
            <p className="text-xs text-zinc-500 mt-3">
              Launcherni o‘rnating, email va parolingiz bilan kiring hamda "O‘ynash" tugmasini bosing. Bitta kompyuterda faqat bitta akkount ishlaydi.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-4">Yuklab olish uchun faol obuna kerak. Obuna sotib oling va klientni o‘rnating.</p>
            <Button size="lg" variant="secondary" onClick={onBuy}><CreditCard size={16} /> Obuna sotib olish</Button>
          </>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <Fingerprint size={20} className="text-[#ffffff]" />
          <h3 className="text-lg font-semibold text-white">HWID</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-2">
          Obunangiz avtomatik tarzda moddan birinchi kirgan kompyuteringizga bog‘lanadi.
          HWID kodni Panel bo‘limida ko‘rishingiz mumkin.
        </p>
        <div className="px-4 py-3 rounded-xl bg-[#ffffff]/5 border border-[#ffffff]/10 font-mono text-sm text-white">
          {profile.hwid || 'Hali bog‘lanmagan — modga kiring'}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound size={20} className="text-[#ffffff]" />
          <h3 className="text-lg font-semibold text-white">Kalit faollashtirish</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">Litsenziya kalitini kiriting va obunangizni faollashtiring.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="XXXX-XXXX-XXXX-XXXX" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} className="flex-1" />
          <Button onClick={activateKey} disabled={keyLoading}>{keyLoading ? <Spinner /> : 'Faollashtirish'}</Button>
        </div>
        {keyMsg && (
          <p className={`mt-2 text-sm flex items-center gap-1.5 ${keyMsg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>
            {keyMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}{keyMsg.text}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pul o‘tkazmalari</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-zinc-500">Hozircha to‘lovlar yo‘q.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div>
                  <div className="text-sm text-white">{planByCode(p.plan_code)?.name || p.plan_code}</div>
                  <div className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString('uz-UZ')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white">{formatPrice(p.amount)}</span>
                  <Badge color={p.status === 'approved' ? 'gold' : p.status === 'rejected' ? 'red' : 'yellow'}>
                    {p.status === 'approved' ? 'Tasdiqlangan' : p.status === 'rejected' ? 'Rad etilgan' : 'Kutmoqda'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ PRICING ============
function PricingView({ onBuy }: { onBuy: (code: string) => void }) {
  return (
    <div>
      <p className="text-zinc-500 mb-8">O‘zingizga mos rejani tanlang va obuna bo‘ling.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const longest = plan.code === '180days';
          return (
            <Card key={plan.code} className={`p-6 relative flex flex-col ${longest ? 'border-[#ffffff]/30 shadow-[0_0_40px_rgba(255,255,255,0.12)]' : ''}`}>
              {longest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge color="gold"><Check size={12} /> Eng uzoq muddat</Badge>
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
              <div className="mt-2 text-2xl font-extrabold text-white">{formatPrice(plan.price)}</div>
              <div className="mt-1 text-sm text-zinc-500">{plan.duration_days} kun</div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {['Barcha xususiyatlarga to‘liq ruxsat', 'Barcha visual funksiyalar', 'HWID himoya', '24/7 texnik yordam', 'Doimiy yangilanish'].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs text-zinc-300">
                    <Check size={14} className="text-[#ffffff] mt-0.5 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="mt-5 w-full" variant={longest ? 'primary' : 'secondary'} onClick={() => onBuy(plan.code)}>Obuna bo‘lish</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ PAYMENT ============
function PaymentView({ planCode, onBack, onPaid }: { planCode: string; onBack: () => void; onPaid: () => Promise<void> }) {
  const { profile } = useAuth();
  const plan = planByCode(planCode)!;
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoData, setPromoData] = useState<{ code: string; discount_percent: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const discountedPrice = promoData ? Math.round(plan.price * (1 - promoData.discount_percent / 100)) : plan.price;

  const validatePromo = async () => {
    if (!promoInput.trim()) { setPromoMsg({ type: 'err', text: 'Promokodni kiriting' }); return; }
    setPromoLoading(true);
    setPromoMsg(null);
    const { data, error } = await supabase.rpc('validate_promocode', { p_code: promoInput.trim() });
    setPromoLoading(false);
    if (error || !data || data.length === 0) {
      setPromoData(null);
      setPromoMsg({ type: 'err', text: 'Bunday promokod topilmadi yoki muddati o‘tgan' });
      return;
    }
    const valid = data[0];
    setPromoData({ code: valid.code, discount_percent: valid.discount_percent });
    setPromoMsg({ type: 'ok', text: `Promokod qabul qilindi! ${valid.discount_percent}% chegirma` });
  };

  const removePromo = () => { setPromoData(null); setPromoInput(''); setPromoMsg(null); };

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(jpg|jpeg|png|webp)/)) { setMsg({ type: 'err', text: 'Faqat JPG, PNG, WEBP ruxsat etiladi' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'err', text: 'Rasm hajmi 5MB dan oshmasligi kerak' }); return; }
    setReceipt(file); setReceiptUrl(URL.createObjectURL(file)); setMsg(null);
  };

  const submitPayment = async () => {
    if (!profile) return;
    if (!receipt) { setMsg({ type: 'err', text: 'Chek rasmini yuklang' }); return; }
    setSubmitting(true);
    const ext = receipt.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('receipts').upload(path, receipt, { upsert: true });
    if (upErr) { setSubmitting(false); setMsg({ type: 'err', text: 'Yuklash xatoligi: ' + upErr.message }); return; }
    const { data: pub } = supabase.storage.from('receipts').getPublicUrl(path);
    const { error: payErr } = await supabase.from('payments').insert({
      user_id: profile.id, plan_code: plan.code, amount: discountedPrice, status: 'pending',
      receipt_path: pub.publicUrl, promo_code: promoData?.code || null,
    });
    if (payErr) { setSubmitting(false); setMsg({ type: 'err', text: 'Xatolik: ' + payErr.message }); return; }
    if (promoData) await supabase.rpc('use_promocode', { p_code: promoData.code });
    setSubmitting(false);
    setMsg({ type: 'ok', text: 'To‘lov yuborildi! Admin tekshirib chiqadi.' });
    setReceipt(null); setReceiptUrl(null); setPromoData(null); setPromoInput(''); setPromoMsg(null);
    await onPaid();
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#ffffff] mb-6 transition-colors">
        <ArrowLeft size={16} /> Narxlarga qaytish
      </button>
      <h2 className="text-2xl font-bold text-white mb-2">To‘lov ma‘lumotlari</h2>
      <p className="text-zinc-500 mb-6">Tanlangan reja: <span className="text-white font-medium">{plan.name}</span></p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <CreditCard size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Humo karta</h3>
                <p className="text-xs text-zinc-500">To‘lovni ushbu kartaga o‘tkazing</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Karta egasi</div>
                <div className="text-white font-medium">{HUMO_OWNER}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Karta raqami</div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                  <span className="text-white font-mono tracking-wider">{HUMO_CARD}</span>
                  <CopyButton text={HUMO_CARD} />
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">To‘lov summasi</div>
                {promoData && <div className="text-sm text-zinc-500 line-through">{formatPrice(plan.price)}</div>}
                <div className="text-2xl font-bold gold-text">{formatPrice(discountedPrice)}</div>
                {promoData && <div className="text-xs text-[#ffffff] mt-1">Chegirma: {promoData.discount_percent}%</div>}
              </div>
            </div>
            <a href={TELEGRAM_SUPPORT} target="_blank" rel="noreferrer" className="block mt-5">
              <Button variant="blue" className="w-full"><MessageCircle size={16} /> Telegram lichkaga o‘tish</Button>
            </a>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Tag size={20} className="text-[#ffffff]" />
              <h3 className="text-lg font-semibold text-white">Promokod</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Promokodni kiriting va chegirma oling.</p>
            {promoData ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/25">
                <div>
                  <span className="text-white font-medium">{promoData.code}</span>
                  <span className="text-[#ffffff] text-sm ml-2">-{promoData.discount_percent}%</span>
                </div>
                <button onClick={removePromo} className="text-zinc-400 hover:text-red-400 transition-colors"><X size={18} /></button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input placeholder="Promokodni kiriting" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} className="flex-1" onKeyDown={(e) => e.key === 'Enter' && validatePromo()} />
                <Button onClick={validatePromo} variant="secondary" disabled={promoLoading}>{promoLoading ? <Spinner /> : 'Tekshirish'}</Button>
              </div>
            )}
            {promoMsg && (
              <p className={`mt-2 text-sm flex items-center gap-1.5 ${promoMsg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>
                {promoMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}{promoMsg.text}
              </p>
            )}
          </Card>
        </div>

        <Card className="p-7">
          <h3 className="text-lg font-semibold text-white mb-2">Chek yuklash</h3>
          <p className="text-sm text-zinc-400 mb-4">To‘lov qilgach, chek rasmini yuklang. Admin 24 soat ichida tekshiradi.</p>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragOver ? 'border-[#ffffff]/50 bg-[#ffffff]/5' : 'border-white/15 hover:border-white/25'}`}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {receiptUrl ? (
              <div>
                <img src={receiptUrl} alt="Chek" className="max-h-40 mx-auto rounded-lg mb-3" />
                <p className="text-sm text-[#ffffff]">{receipt?.name}</p>
                <p className="text-xs text-zinc-500 mt-1">Boshqa rasm tanlash uchun bosing</p>
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto text-zinc-500 mb-3" />
                <p className="text-sm text-zinc-300">Rasmni shu yerga tashlang</p>
                <p className="text-xs text-zinc-500 mt-1">JPG, PNG, WEBP — maks 5MB</p>
              </div>
            )}
          </label>
          {msg && (
            <div className={`mt-4 flex items-start gap-2 p-3 rounded-xl text-sm ${msg.type === 'ok' ? 'bg-[#ffffff]/10 text-[#ffffff] border border-[#ffffff]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {msg.type === 'ok' ? <Check size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>Admin chekni 24 soat ichida tekshirib chiqadi.</span>
          </div>
          <Button className="w-full mt-4" onClick={submitPayment} disabled={submitting}>{submitting ? <Spinner /> : 'To‘lovni tasdiqlash'}</Button>
        </Card>
      </div>
    </div>
  );
}

// ============ REFERRAL ============
function ReferralView() {
  const { profile } = useAuth();
  const [refCount, setRefCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', profile.id);
      setRefCount(count || 0);
      const { data } = await supabase.from('profiles').select('subscription_plan').eq('referred_by', profile.id).not('subscription_plan', 'is', null);
      setActiveCount(data?.length || 0);
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;
  const refLink = `https://${SITE_DOMAIN}/?ref=${profile.referral_code}`;

  return (
    <div>
      <Badge color="gold">Referal tizim</Badge>
      <h2 className="mt-3 text-2xl font-bold text-white mb-2">Do‘stlaringizni taklif qiling va mukofotlar oling</h2>
      <p className="text-zinc-500 mb-8">Har bir faol referal obunasidan 20% daromad oling.</p>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <div className="w-10 h-10 rounded-xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center mb-3">
            <Users size={18} className="text-[#ffffff]" />
          </div>
          <div className="text-sm text-zinc-500">Jami referallar</div>
          <div className="text-3xl font-bold text-white mt-1">{loading ? '...' : refCount}</div>
        </Card>
        <Card className="p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Gift size={18} className="text-blue-400" />
          </div>
          <div className="text-sm text-zinc-500">Xarid qilgan referallar</div>
          <div className="text-3xl font-bold text-white mt-1">{loading ? '...' : activeCount}</div>
        </Card>
      </div>
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Sizning referal kodingiz</h3>
        <p className="text-sm text-zinc-400 mb-4">Do‘stlaringizga ushbu linkni ulashing.</p>
        <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10 gap-2">
          <span className="text-white font-mono text-sm truncate">{refLink}</span>
          <CopyButton text={refLink} />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Taraqqiyot</h3>
        {activeCount === 0 ? <p className="text-sm text-zinc-500">Hozirda faol referallaringiz yo‘q.</p> : <p className="text-sm text-zinc-500">{activeCount} ta faol referalingiz bor.</p>}
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="w-10 h-10 rounded-full bg-[#ffffff]/15 border border-[#ffffff]/25 flex items-center justify-center text-[#ffffff] font-bold">1</div>
          <div>
            <div className="text-sm text-white font-medium">Daraja 1</div>
            <div className="text-xs text-zinc-400">20% kun referal obunasidan</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============ ECOSYSTEM ============
function EcosystemView() {
  const { profile } = useAuth();
  const hasSub = !!profile?.subscription_plan;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Cloud size={22} className="text-[#ffffff]" />
        <h2 className="text-2xl font-bold text-white">Konfiguratsiyalar</h2>
      </div>
      <p className="text-zinc-500 mb-8">Bulutli xizmatlar va integratsiyalar.</p>
      <Card className="p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center mx-auto mb-4">
          <Link2 size={26} className="text-[#ffffff]" />
        </div>
        <h3 className="text-lg font-semibold text-white">Bulutli konfiglar</h3>
        {!hasSub ? (
          <>
            <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">Bulutli xizmatlarga kirish uchun faol obuna kerak.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-400"><AlertCircle size={16} /> Obuna faol emas</div>
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-400">Sizda bulutli konfiguratsiyalarga ruxsat mavjud.</p>
        )}
      </Card>
    </div>
  );
}

// ============ BONUS (BOX) ============
type BoxResult =
  | { type: 'promo'; code: string; discount_percent: number }
  | { type: 'subscription'; expires: string }
  | { type: 'error'; message: string };

const BOX_CHANCES = [
  { pct: 55, label: '10% chegirma', desc: 'BONUS10-XXXXXX promokodi', color: 'text-zinc-300 border-white/20 bg-white/5' },
  { pct: 25, label: '25% chegirma', desc: 'BONUS25-XXXXXX promokodi', color: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  { pct: 15, label: '50% chegirma', desc: 'BONUS50-XXXXXX promokodi', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  { pct: 5, label: '1 oylik obuna', desc: 'Akkauntga to‘g‘ridan-to‘g‘ri qo‘shiladi', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
];

function BonusView() {
  const { refreshProfile } = useAuth();
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<BoxResult | null>(null);

  const openBox = async () => {
    if (opening) return;
    setOpening(true);
    setResult(null);
    const { data, error } = await supabase.rpc('open_box');
    setOpening(false);
    if (error) {
      if (error.message.includes('open_box')) {
        setResult({ type: 'error', message: 'Bonus tizimi hozircha sozlanmagan. Administratorga murojaat qiling.' });
      } else {
        setResult({ type: 'error', message: 'Xatolik: ' + error.message });
      }
      return;
    }
    const r = data as (BoxResult & { error?: string });
    if (r.error) { setResult({ type: 'error', message: r.error }); return; }
    if (r.type === 'subscription') await refreshProfile();
    setResult(r);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Gift size={22} className="text-[#ffffff]" />
        <h2 className="text-2xl font-bold text-white">Bonus</h2>
      </div>
      <p className="text-zinc-500 mb-8">Kuniga 1 marta boxni oching va sovg‘alardan birini yutib oling.</p>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* BOX */}
        <Card className="relative p-8 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#ffffff]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            <div className={`relative ${opening ? 'animate-[scaleIn_0.4s_ease-out_infinite]' : 'animate-[float_4s_ease-in-out_infinite]'}`}>
              <div className="absolute inset-0 rounded-full bg-[#ffffff]/15 blur-2xl scale-150" />
              <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#ffffff]/25 to-[#ffffff]/5 border border-[#ffffff]/25 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.25)]">
                <Gift size={52} className="text-[#ffffff]" />
              </div>
              <SparkleDots />
            </div>

            <h3 className="mt-8 text-xl font-bold text-white">Sovg‘a qutisi</h3>
            <p className="mt-2 text-sm text-zinc-400 max-w-sm">
              Ochish orqali chegirma promokodi yoki 1 oylik obuna yutib olishingiz mumkin.
            </p>

            {!result && (
              <Button size="lg" className="mt-7 relative overflow-hidden group" onClick={openBox} disabled={opening}>
                {opening ? <Spinner /> : <><PartyPopper size={18} /> Boxni ochish</>}
              </Button>
            )}

            {/* RESULT */}
            {result && result.type === 'promo' && (
              <div className="mt-7 w-full animate-[scaleIn_0.4s_ease-out_both]">
                <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
                  <div className="text-xs uppercase tracking-wider text-amber-400 mb-1">Tabriklaymiz! {result.discount_percent}% chegirma</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-mono font-bold text-white tracking-wider">{result.code}</span>
                    <CopyButton text={result.code} />
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">Promokodni to‘lov sahifasida kiriting. 1 marta ishlatiladi.</p>
                </div>
                <button onClick={() => setResult(null)} className="mt-4 text-sm text-zinc-400 hover:text-white transition-colors">Yana ochish</button>
              </div>
            )}

            {result && result.type === 'subscription' && (
              <div className="mt-7 w-full animate-[scaleIn_0.4s_ease-out_both]">
                <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check size={20} className="text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-emerald-300">Sizning akkauntingizga 1 oylik obuna muvaffaqiyatli qo‘shildi</div>
                      <div className="mt-1 text-xs text-zinc-400">Faol: {result.expires} gacha</div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setResult(null)} className="mt-4 text-sm text-zinc-400 hover:text-white transition-colors">Yana ochish</button>
              </div>
            )}

            {result && result.type === 'error' && (
              <div className="mt-7 w-full animate-[scaleIn_0.4s_ease-out_both]">
                <div className="rounded-2xl p-5 bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 text-left">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* CHANCES */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Timer size={18} className="text-[#ffffff]" /> Sovg‘alar va ehtimolliklar
          </h3>
          <div className="space-y-3">
            {BOX_CHANCES.map((c) => (
              <Card key={c.pct} className="p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 ${c.color}`}>
                  <span className="text-sm font-bold">{c.pct}%</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{c.label}</div>
                  <div className="text-xs text-zinc-500 truncate">{c.desc}</div>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#ffffff] to-[#ffffff]/60" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-600">Foizlar qat’iy belgilangan va har ochishda tasodifiy tanlanadi.</p>
        </div>
      </div>
    </div>
  );
}

function SparkleDots() {
  return (
    <>
      {[
        'top-0 left-2 animate-[particleFloat_2.5s_ease-in-out_infinite]',
        'top-4 -right-3 animate-[particleFloat_3s_ease-in-out_0.5s_infinite]',
        'bottom-2 -left-4 animate-[particleFloat_2.2s_ease-in-out_1s_infinite]',
      ].map((pos, i) => (
        <span key={i} className={`absolute w-2 h-2 rounded-full bg-[#ffffff]/60 ${pos}`} />
      ))}
    </>
  );
}
