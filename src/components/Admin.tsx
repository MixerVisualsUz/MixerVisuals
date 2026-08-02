import { useState, useEffect } from 'react';
import { Shield, Search, KeyRound, Users, CreditCard, Check, X, Ban, ShieldCheck, Tag, Plus, Trash2, Fingerprint, Gift, Pencil, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Input, Spinner, Button } from './ui';
import { supabase } from '../lib/supabase';
import { getAllPlans, loadPlans, formatPrice, planByCode } from '../lib/plans';
import type { LicenseKey, Payment, Profile, Plan, Promocode } from '../lib/types';

type AdminTab = 'payments' | 'users' | 'plans' | 'promocodes' | 'blocked';

export function Admin() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>('payments');
  const [, forceRender] = useState(0);

  useEffect(() => {
    loadPlans().then(() => forceRender((x) => x + 1));
  }, []);

  if (!profile || profile.role !== 'admin') {
    return <div className="pt-32 px-5 text-center"><p className="text-zinc-400">Sizda admin huquqlari yo‘q.</p></div>;
  }

  const tabs: { id: AdminTab; label: string; icon: typeof KeyRound }[] = [
    { id: 'payments', label: 'To‘lovlar', icon: CreditCard },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    { id: 'plans', label: 'Tariflar', icon: Tag },
    { id: 'promocodes', label: 'Promokodlar', icon: Gift },
    { id: 'blocked', label: 'Bloklar', icon: Ban },
  ];

  return (
    <div className="pt-24 pb-20 px-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#ffffff] to-[#ffffff] flex items-center justify-center">
          <Shield size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin panel</h1>
          <p className="text-sm text-zinc-500">Boshqaruv markazi</p>
        </div>
      </div>
      <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${tab === t.id ? 'bg-gradient-to-r from-[#ffffff] to-[#ffffff] text-black font-semibold' : 'text-zinc-400 hover:text-white'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'plans' && <PlansTab />}
      {tab === 'promocodes' && <PromocodesTab />}
      {tab === 'blocked' && <BlockedTab />}
    </div>
  );
}

type PaymentRow = Payment & { profiles?: { email?: string; username?: string } | null };

function PaymentsTab() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, profiles(email, username)')
      .order('created_at', { ascending: false });
    setPayments((data as PaymentRow[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approvePayment = async (p: PaymentRow) => {
    await supabase.from('payments').update({ status: 'approved' }).eq('id', p.id);
    if (p.plan_code === 'hwid_reset') {
      await supabase.from('profiles').update({ hwid: null }).eq('id', p.user_id);
      load();
      return;
    }
    const plan = planByCode(p.plan_code);
    if (!plan) return;
    const base = new Date();
    base.setDate(base.getDate() + plan.duration_days);
    const newExpires = base.toISOString().slice(0, 10);
    await supabase.from('profiles').update({ subscription_plan: plan.code, subscription_expires: newExpires }).eq('id', p.user_id);
    load();
  };
  const rejectPayment = async (id: string) => { await supabase.from('payments').update({ status: 'rejected' }).eq('id', id); load(); };

  if (loading) return <div className="flex justify-center py-12"><Spinner className="text-[#ffffff]" /></div>;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#ffffff]" /> To‘lovlar</h3>
      {payments.length === 0 ? <Card className="p-6 text-center text-zinc-500">To‘lovlar yo‘q.</Card> : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-white text-sm">
                  {planByCode(p.plan_code)?.name || (p.plan_code === 'hwid_reset' ? 'HWID yangilash' : p.plan_code)} — {formatPrice(p.amount)}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {p.profiles?.email || 'noma‘lum email'} {p.profiles?.username && <span className="text-zinc-500">({p.profiles.username})</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {new Date(p.created_at).toLocaleDateString('uz-UZ')} {new Date(p.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  {p.promo_code && <span className="ml-2 text-[#ffffff]">Promo: {p.promo_code}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.receipt_path && <a href={p.receipt_path} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm">Chekni ko‘rish</Button></a>}
                {p.status === 'pending' ? (
                  <>
                    <Button size="sm" onClick={() => approvePayment(p)}><Check size={14} /> Tasdiqlash</Button>
                    <Button size="sm" variant="secondary" onClick={() => rejectPayment(p.id)}><X size={14} /> Rad</Button>
                  </>
                ) : (
                  <Badge color={p.status === 'approved' ? 'gold' : 'red'}>{p.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantPlan, setGrantPlan] = useState('30days');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string; userId: string } | null>(null);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleBlock = async (u: Profile) => { await supabase.from('profiles').update({ blocked: !u.blocked }).eq('id', u.id); load(); };
  const clearHwid = async (u: Profile) => { await supabase.from('profiles').update({ hwid: null }).eq('id', u.id); load(); };

  const clearAllHwids = async () => {
    if (!window.confirm('BARCHA foydalanuvchilarning HWID bog‘lanishini tozalaysizmi? Har bir foydalanuvchi o‘z qurilmasida qaytadan kirishi kerak bo‘ladi.')) return;
    const { error } = await supabase.from('profiles').update({ hwid: null }).neq('hwid', null);
    setMsg({ type: error ? 'err' : 'ok', text: error ? 'Xatolik: ' + error.message : 'Barcha HWIDlar tozalandi', userId: 'all' });
    load();
  };

  const grantSub = async (u: Profile) => {
    const plan = planByCode(grantPlan);
    if (!plan) return;
    const base = new Date();
    base.setDate(base.getDate() + plan.duration_days);
    const expires = base.toISOString().slice(0, 10);
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_plan: plan.code, subscription_expires: expires })
      .eq('id', u.id);
    setMsg({ type: error ? 'err' : 'ok', text: error ? 'Xatolik: ' + error.message : `Obuna berildi: ${plan.name}`, userId: u.id });
    setGrantUserId(null);
    load();
  };

  const removeSub = async (u: Profile) => {
    await supabase.from('profiles').update({ subscription_plan: null, subscription_expires: null }).eq('id', u.id);
    setMsg({ type: 'ok', text: 'Obuna olib tashlandi', userId: u.id });
    load();
  };

  const deleteAccount = async (u: Profile) => {
    if (!window.confirm(`"${u.email}" akkountini butunlay o‘chirib tashlaysizmi? Bu amalni qaytarib bo‘lmaydi!`)) return;
    const { error } = await supabase.functions.invoke('admin-delete-user', { body: { id: u.id } });
    if (error) {
      const detail = (error.context as { message?: string } | undefined)?.message || '';
      setMsg({ type: 'err', text: 'O‘chirish xatoligi: ' + (detail || error.message || 'noma‘lum'), userId: u.id });
      return;
    }
    setMsg({ type: 'ok', text: 'Akkount o‘chirildi', userId: u.id });
    load();
  };

  const filtered = users.filter((u) => !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.username || '').toLowerCase().includes(search.toLowerCase()) || (u.hwid || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><Spinner className="text-[#ffffff]" /></div>;

  return (
    <div>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input placeholder="Email, username yoki HWID bo‘yicha qidirish..." className="pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex items-center justify-end mb-3">
        <Button size="sm" variant="ghost" onClick={clearAllHwids}><Fingerprint size={14} /> Barcha HWIDlarni tozalash</Button>
      </div>
      {msg && msg.userId === 'all' && (
        <p className={`text-xs mb-3 ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.id} className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-white text-sm">
                  {u.email}
                  {u.username && <span className="text-zinc-500"> ({u.username})</span>}
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2 flex-wrap">
                  <Fingerprint size={12} /> HWID: {u.hwid || 'kiritilmagan'}
                  <span className="text-zinc-600">•</span> Obuna: {planByCode(u.subscription_plan || '')?.name || 'yo‘q'}
                  {u.subscription_expires && <span className="text-zinc-600">• {u.subscription_expires}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {u.role === 'admin' && <Badge color="gold">Admin</Badge>}
                {u.blocked ? <Badge color="red"><Ban size={12} /> Bloklangan</Badge> : <Badge color="green"><ShieldCheck size={12} /> Faol</Badge>}
                {u.hwid && <Button size="sm" variant="ghost" onClick={() => clearHwid(u)}><Fingerprint size={14} /> HWID tozalash</Button>}
                <Button size="sm" variant="secondary" onClick={() => toggleBlock(u)}>{u.blocked ? 'Blokdan chiqarish' : 'Bloklash'}</Button>
                <Button size="sm" variant="secondary" onClick={() => deleteAccount(u)} className="!text-red-400"><Trash2 size={14} /> O‘chirish</Button>
              </div>
            </div>
            {msg && msg.userId === u.id && (
              <p className={`text-xs ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
            )}
            {grantUserId === u.id ? (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={grantPlan}
                  onChange={(e) => setGrantPlan(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-100 text-sm outline-none transition-all focus:border-[#ffffff]/50"
                >
                  {getAllPlans().map((p) => (
                    <option key={p.code} value={p.code} className="bg-black text-gray-100">{p.name} — {formatPrice(p.price)}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => grantSub(u)}><Check size={14} /> Tasdiqlash</Button>
                <Button size="sm" variant="ghost" onClick={() => setGrantUserId(null)}>Bekor qilish</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="secondary" onClick={() => setGrantUserId(u.id)}><Plus size={14} /> Obuna berish</Button>
                {u.subscription_plan && (
                  <Button size="sm" variant="ghost" onClick={() => removeSub(u)}><X size={14} /> Obunani olib tashlash</Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function BlockedTab() {
  const [ips, setIps] = useState<{ id: string; ip: string; note: string; created_at: string }[]>([]);
  const [emails, setEmails] = useState<{ id: string; email: string; note: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [ipInput, setIpInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    const [i, e] = await Promise.all([
      supabase.from('blocked_ips').select('*').order('created_at', { ascending: false }),
      supabase.from('blocked_emails').select('*').order('created_at', { ascending: false }),
    ]);
    setIps((i.data as typeof ips) || []);
    setEmails((e.data as typeof emails) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addIp = async () => {
    const ip = ipInput.trim();
    if (!ip) { setMsg({ type: 'err', text: 'IP manzilni kiriting' }); return; }
    const { error } = await supabase.from('blocked_ips').insert({ ip, note: note.trim() });
    if (error) { setMsg({ type: 'err', text: error.message.includes('duplicate') ? 'Bu IP allaqachon bloklangan' : 'Xatolik: ' + error.message }); return; }
    setIpInput('');
    setMsg({ type: 'ok', text: 'IP abadiy bloklandi' });
    load();
  };

  const addEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) { setMsg({ type: 'err', text: 'Email kiriting' }); return; }
    const { error } = await supabase.from('blocked_emails').insert({ email, note: note.trim() });
    if (error) { setMsg({ type: 'err', text: error.message.includes('duplicate') ? 'Bu email allaqachon bloklangan' : 'Xatolik: ' + error.message }); return; }
    setEmailInput('');
    setMsg({ type: 'ok', text: 'Email abadiy bloklandi' });
    load();
  };

  const removeIp = async (id: string) => { await supabase.from('blocked_ips').delete().eq('id', id); load(); };
  const removeEmail = async (id: string) => { await supabase.from('blocked_emails').delete().eq('id', id); load(); };

  if (loading) return <div className="flex justify-center py-12"><Spinner className="text-[#ffffff]" /></div>;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Ban size={18} className="text-[#ffffff]" /> Bloklangan IP'lar</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-3 -mt-2">Bloklangan IP'dan saytda boshqa hech qachon akkount ochib bo‘lmaydi (ro‘yxatdan o‘tish 403 bilan rad etiladi).</p>
        <Card className="p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3 items-start">
            <Input label="IP manzil" placeholder="masalan: 91.122.44.7" value={ipInput} onChange={(e) => setIpInput(e.target.value)} />
            <Input label="Izoh (ixtiyoriy)" placeholder="masalan: gemini spam" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="sm:pt-7">
              <Button size="sm" onClick={addIp}><Plus size={14} /> IP bloklash</Button>
            </div>
          </div>
        </Card>
        {ips.length === 0 ? <Card className="p-6 text-center text-zinc-500">Bloklangan IP yo‘q.</Card> : (
          <div className="space-y-2">
            {ips.map((b) => (
              <Card key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[#ffffff] text-sm">{b.ip}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(b.created_at).toLocaleDateString('uz-UZ')}
                    {b.note && <span className="text-zinc-400"> • {b.note}</span>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeIp(b.id)} className="!text-red-400"><Trash2 size={14} /> O‘chirish</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Ban size={18} className="text-[#ffffff]" /> Bloklangan emaillar</h3>
        </div>
        <p className="text-xs text-zinc-500 mb-3 -mt-2">Bloklangan email bilan ro‘yxatdan o‘tib bo‘lmaydi. Gemini spam emaillari allaqachon qo‘shilgan.</p>
        <Card className="p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3 items-start">
            <Input label="Email" placeholder="masalan: spam@gmail.com" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            <Input label="Izoh (ixtiyoriy)" placeholder="masalan: gemini spam" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="sm:pt-7">
              <Button size="sm" onClick={addEmail}><Plus size={14} /> Email bloklash</Button>
            </div>
          </div>
        </Card>
        {emails.length === 0 ? <Card className="p-6 text-center text-zinc-500">Bloklangan email yo‘q.</Card> : (
          <div className="space-y-2">
            {emails.map((b) => (
              <Card key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[#ffffff] text-sm">{b.email}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(b.created_at).toLocaleDateString('uz-UZ')}
                    {b.note && <span className="text-zinc-400"> • {b.note}</span>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeEmail(b.id)} className="!text-red-400"><Trash2 size={14} /> O‘chirish</Button>
              </Card>
            ))}
          </div>
        )}
        {msg && <p className={`text-xs mt-3 ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', price: '', duration_days: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [hwidPrice, setHwidPrice] = useState('');
  const [hwidMsg, setHwidMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
    setPlans((data as Plan[]) || []);
    setLoading(false);
  };
  const loadHwidPrice = async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'hwid_reset_price').single();
    if (data?.value != null) setHwidPrice(String(data.value));
  };
  useEffect(() => { load(); loadHwidPrice(); }, []);

  const saveHwidPrice = async () => {
    const price = parseInt(hwidPrice);
    if (isNaN(price) || price <= 0) { setHwidMsg({ type: 'err', text: 'Narxni to‘g‘ri kiriting' }); return; }
    const { error } = await supabase.from('settings').update({ value: String(price) }).eq('key', 'hwid_reset_price');
    setHwidMsg(error ? { type: 'err', text: 'Xatolik: ' + error.message } : { type: 'ok', text: 'Narx saqlandi' });
  };

  const toggleActive = async (p: Plan) => { await supabase.from('plans').update({ active: !p.active }).eq('code', p.code); load(); };

  const startEdit = (p: Plan) => {
    setEditing(p.code);
    setEdit({ name: p.name, price: String(p.price), duration_days: String(p.duration_days) });
    setMsg(null);
  };

  const saveEdit = async (p: Plan) => {
    const price = parseInt(edit.price);
    const duration = parseInt(edit.duration_days);
    if (!edit.name.trim() || isNaN(price) || price <= 0) { setMsg('Narx va nomni to‘g‘ri kiriting'); return; }
    const { error } = await supabase
      .from('plans')
      .update({ name: edit.name.trim(), price, duration_days: isNaN(duration) ? p.duration_days : duration })
      .eq('code', p.code);
    if (error) { setMsg('Xatolik: ' + error.message); return; }
    setEditing(null);
    setMsg(null);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner className="text-[#ffffff]" /></div>;

  return (
    <div className="space-y-2">
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-[#ffffff]/15">
        <div>
          <div className="text-white font-medium flex items-center gap-2"><RefreshCw size={16} className="text-[#ffffff]" /> HWID yangilash narxi</div>
          <div className="text-xs text-zinc-500 mt-1">Foydalanuvchi HWIDni tozalash uchun to‘laydigan narx</div>
        </div>
        <div className="flex items-center gap-2">
          <Input type="number" value={hwidPrice} onChange={(e) => setHwidPrice(e.target.value)} className="w-32" placeholder="10000" />
          <Button size="sm" onClick={saveHwidPrice}><Check size={14} /> Saqlash</Button>
        </div>
        {hwidMsg && <p className={`text-xs sm:hidden ${hwidMsg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>{hwidMsg.text}</p>}
        {hwidMsg && <p className={`hidden sm:block text-xs ${hwidMsg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>{hwidMsg.text}</p>}
      </Card>
      {plans.map((p) => (
        <Card key={p.code} className="p-4">
          {editing === p.code ? (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3 items-start">
                <Input label="Nom" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                <Input label="Narx (so‘m)" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} />
                <Input label="Kunlar (-1 = cheksiz)" type="number" value={edit.duration_days} onChange={(e) => setEdit({ ...edit, duration_days: e.target.value })} />
              </div>
              {msg && <p className="text-xs text-red-400">{msg}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(p)}><Check size={14} /> Saqlash</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Bekor qilish</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-white font-medium flex items-center gap-2">{p.name} <span className="text-xs font-mono text-zinc-500">{p.code}</span></div>
                <div className="text-xs text-zinc-500 mt-1">{formatPrice(p.price)} • {p.duration_days} kun</div>
              </div>
              <div className="flex items-center gap-2">
                {p.active ? <Badge color="gold">Faol</Badge> : <Badge color="gray">Faol emas</Badge>}
                <Button size="sm" variant="secondary" onClick={() => toggleActive(p)}>{p.active ? 'O‘chirish' : 'Yoqish'}</Button>
                <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Pencil size={14} /> Tahrirlash</Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function PromocodesTab() {
  const [promos, setPromos] = useState<Promocode[]>([]);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percent: '10', max_uses: '5' });
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyPlan, setKeyPlan] = useState('30days');
  const [keyCount, setKeyCount] = useState('1');
  const [keyMsg, setKeyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    const [{ data: pr }, { data: k }] = await Promise.all([
      supabase.from('promocodes').select('*').order('created_at', { ascending: false }),
      supabase.from('license_keys').select('*').order('created_at', { ascending: false }),
    ]);
    setPromos((pr as Promocode[]) || []);
    setKeys((k as LicenseKey[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createPromo = async () => {
    if (!form.code.trim() || !form.discount_percent) { setMsg({ type: 'err', text: 'Barcha maydonlarni to‘ldiring' }); return; }
    const discount = parseInt(form.discount_percent);
    const maxUses = parseInt(form.max_uses) || -1;
    if (discount < 0 || discount > 100) { setMsg({ type: 'err', text: 'Chegirma 0-100% oralig‘ida bo‘lishi kerak' }); return; }
    const { error } = await supabase.from('promocodes').insert({
      code: form.code.trim().toUpperCase(), discount_percent: discount, max_uses: maxUses, used_count: 0, active: true,
    });
    if (error) { setMsg({ type: 'err', text: error.message.includes('duplicate') ? 'Bu promokod allaqachon mavjud' : error.message }); return; }
    setForm({ code: '', discount_percent: '10', max_uses: '5' });
    setShowForm(false);
    setMsg(null);
    load();
  };

  const togglePromo = async (p: Promocode) => { await supabase.from('promocodes').update({ active: !p.active }).eq('id', p.id); load(); };
  const deletePromo = async (p: Promocode) => { await supabase.from('promocodes').delete().eq('id', p.id); load(); };

  const randomCode = () => {
    const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
    return `MV-${seg()}-${seg()}-${seg()}`;
  };

  const generateKeys = async () => {
    const n = Math.min(Math.max(parseInt(keyCount) || 1, 1), 50);
    const rows = Array.from({ length: n }, () => ({ code: randomCode(), plan_code: keyPlan }));
    const { error } = await supabase.from('license_keys').insert(rows);
    if (error) {
      setKeyMsg({ type: 'err', text: 'Xatolik: ' + error.message });
      return;
    }
    setKeyMsg({ type: 'ok', text: `${n} ta kalit yaratildi (${planByCode(keyPlan)?.name || keyPlan})` });
    setShowKeyForm(false);
    load();
  };

  const deleteKey = async (k: LicenseKey) => {
    if (k.used_by && !window.confirm('Kalit ishlatilgan. O‘chirish kalitni bekor qiladi. Davom etasizmi?')) return;
    await supabase.from('license_keys').delete().eq('id', k.id);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner className="text-[#ffffff]" /></div>;

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><KeyRound size={18} className="text-[#ffffff]" /> Litsenziya kalitlari</h3>
          <Button size="sm" onClick={() => setShowKeyForm(!showKeyForm)}>{showKeyForm ? <X size={16} /> : <Plus size={16} />} {showKeyForm ? 'Bekor qilish' : 'Kalit yaratish'}</Button>
        </div>
        {showKeyForm && (
          <Card className="p-5 mb-4 space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Reja</label>
                <select
                  value={keyPlan}
                  onChange={(e) => setKeyPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-100 outline-none transition-all focus:border-[#ffffff]/50 focus:bg-white/[0.07]"
                >
                  {getAllPlans().map((p) => (
                    <option key={p.code} value={p.code} className="bg-black text-gray-100">{p.name} — {formatPrice(p.price)}</option>
                  ))}
                </select>
              </div>
              <Input label="Kalitlar soni (1-50)" type="number" min={1} max={50} placeholder="1" value={keyCount} onChange={(e) => setKeyCount(e.target.value)} />
            </div>
            {keyMsg && <p className={`text-sm ${keyMsg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>{keyMsg.text}</p>}
            <Button onClick={generateKeys}><Plus size={16} /> Yaratish</Button>
          </Card>
        )}
        {keys.length === 0 ? <Card className="p-6 text-center text-zinc-500">Kalitlar yo‘q.</Card> : (
          <div className="space-y-2">
            {keys.map((k) => (
              <Card key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[#ffffff] text-sm">{k.code}</div>
                  <div className="text-xs text-zinc-500 mt-1">{planByCode(k.plan_code)?.name || k.plan_code}</div>
                </div>
                <div className="flex items-center gap-2">
                  {k.used_by ? <Badge color="gold"><Check size={12} /> Ishlatilgan</Badge> : <Badge color="gray">Ishlatilmagan</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => deleteKey(k)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Gift size={18} className="text-[#ffffff]" /> Promokodlar</h3>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Bekor qilish' : 'Yangi promokod'}</Button>
        </div>
        {showForm && (
          <Card className="p-5 mb-4 space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid sm:grid-cols-3 gap-3 items-start">
              <Input label="Promokod kodi" placeholder="MASALAN: MIXER10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <Input label="Chegirma (%)" type="number" placeholder="10" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
              <Input label="Maksimal ishlatish" type="number" placeholder="5" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
            </div>
            {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-[#ffffff]' : 'text-red-400'}`}>{msg.text}</p>}
            <Button onClick={createPromo}>Yaratish</Button>
          </Card>
        )}
        {promos.length === 0 ? <Card className="p-6 text-center text-zinc-500">Promokodlar yo‘q.</Card> : (
          <div className="space-y-2">
            {promos.map((p) => (
              <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[#ffffff] text-sm">{p.code}</div>
                  <div className="text-xs text-zinc-500 mt-1">Chegirma: {p.discount_percent}% • Ishlatilgan: {p.used_count}/{p.max_uses === -1 ? '∞' : p.max_uses}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.active ? <Badge color="gold">Faol</Badge> : <Badge color="gray">Faol emas</Badge>}
                  <Button size="sm" variant="secondary" onClick={() => togglePromo(p)}>{p.active ? 'O‘chirish' : 'Yoqish'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePromo(p)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
