'use client';
/* Pieces several khabo team pages share: remembered filters, plan badge, owner requests (with the
   answer box), activity rows and the "Add a restaurant" box. Ported from archive/prototype/panel/admin.js. */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { C } from '@/lib/khabo';
import type { Plan } from '@/lib/data/types';
import {
  addR, addUser, allR, can, contactOf, findUser, fresh, getR, logIn, monoOf, mutate, resolveRequest, slugOf,
  type Log, type PR, type Req,
} from '@/lib/panel/store';
import { leadFix, logWhat, stageOf } from '@/lib/panel/admin';
import { PLANS, REQ, REQ_STATE } from '@/lib/panel/words';
import { InviteCard, type Invite } from '../users';
import { AreaF, Av, Ico, Modal, MonoR, SelF, TextF, useAgo, usePanel, useT } from '../ui';
import '@/styles/panel-admin.css';

/* ---------- filters that stay as they were when you come back to a page ---------- */
const KEEP = new Map<string, unknown>();
export function useKeep<T>(k: string, init: T) {
  const [v, setV] = useState<T>(() => (KEEP.has(k) ? (KEEP.get(k) as T) : init));
  const set = useCallback((x: T | ((p: T) => T)) => setV(p => {
    const n = typeof x === 'function' ? (x as (p: T) => T)(p) : x;
    KEEP.set(k, n); return n;
  }), [k]);
  return [v, set] as const;
}

/** the time now, kept fresh every half minute (for "locked", "new this week" and date filters) */
export function useNow(every = 30e3) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const tm = setInterval(() => setNow(Date.now()), every); return () => clearInterval(tm); }, [every]);
  return now;
}

/** links inside the team panel */
export function useA() {
  const { lang } = useI();
  return useCallback((p = '') => `/${lang}/admin${p ? '/' + p.replace(/^\//, '') : ''}`, [lang]);
}

export function PlanBadge({ p }: { p: Plan }) {
  const i = useI();
  return <span className={clsx('badge', p === 'premium' ? 'gold' : p === 'pro' ? 'ind' : '')}>{i.L(PLANS[p]?.name || { en: p, bn: p })}</span>;
}

/* ---------- requests from owners ---------- */
/** what the owner asked for, in words */
export function ReqWhat({ q }: { q: Req }) {
  const t = useT();
  if (q.kind === 'name') return <>{t('New name: ', 'নতুন নাম: ')}“{q.data.en}”{q.data.bn ? <> / <span className="bn">{q.data.bn}</span></> : null}</>;
  return <>{q.data?.text || ''}</>;
}
/** a list of requests. act = with Approve / Mark done / Decline (and the box for the answer) */
export function ReqRows({ list, act }: { list: Req[]; act?: boolean }) {
  const i = useI(), t = useT(), ago = useAgo(), a = useA(), { db } = usePanel();
  const [pick, setPick] = useState<{ q: Req; ok: boolean } | null>(null);
  return (
    <>
      {list.map(q => {
        const r = getR(db, q.rid); if (!r) return null;
        const st = REQ_STATE[q.state];
        return (
          <div className="row rq" key={q.id}>
            <MonoR r={r} />
            <div>
              <b>{i.L(r.name)} · {i.L(REQ[q.kind] || { en: q.kind, bn: q.kind })}</b>
              <span className="rq-w"><ReqWhat q={q} /></span>
              <span className="meta">{q.by} · {ago(q.at)}{q.note ? ` · “${q.note}”` : ''}
                {q.state !== 'open' && q.doneBy ? ` · ${i.L(st[0])} · ${q.doneBy} ${q.doneAt ? ago(q.doneAt) : ''}` : ''}</span>
              {q.state !== 'open' && q.reply ? <span className="rq-reply"><Ico n="chat-circle-dots" sm />{q.reply}</span> : null}
            </div>
            {act ? (
              <span className="rq-a">
                {q.kind !== 'name' ? <Link className="btn sm ghost" href={a(`r/${r.id}/settings`)}>{t('Open settings', 'সেটিংস খুলুন')}</Link> : null}
                <button type="button" className="btn sm ghost" onClick={() => setPick({ q, ok: false })}>{t('Decline', 'না বলুন')}</button>
                <button type="button" className="btn sm pri" onClick={() => setPick({ q, ok: true })}>{q.kind === 'name' ? t('Approve', 'হ্যাঁ বলুন') : t('Mark done', 'হয়ে গেছে')}</button>
              </span>
            ) : <span className={clsx('badge', st[1])}>{i.L(st[0])}</span>}
          </div>
        );
      })}
      <Resolve pick={pick} onClose={() => setPick(null)} />
    </>
  );
}
/** Approve / Mark done / Decline asks for a short answer the owner will read */
function Resolve({ pick, onClose }: { pick: { q: Req; ok: boolean } | null; onClose: () => void }) {
  const i = useI(), t = useT(), a = useA(), { db } = usePanel();
  const [reply, setReply] = useState('');
  const q = pick?.q, ok = !!pick?.ok, r = q ? getR(db, q.rid) : undefined;
  const verb = ok ? (q?.kind === 'name' ? t('Approve', 'হ্যাঁ বলুন') : t('Mark done', 'হয়ে গেছে')) : t('Decline', 'না বলুন');
  const close = () => { setReply(''); onClose(); };
  const go = () => {
    if (!q) return;
    if (!resolveRequest(q.id, ok, reply.trim())) return;
    toast.success(ok
      ? q.kind === 'name' ? t(`Name changed to ${q.data.en}. The owner has been told.`, `নাম বদলে ${q.data.bn || q.data.en} করা হয়েছে। মালিককে জানানো হয়েছে।`) : t('Marked done. The owner has been told.', 'হয়ে গেছে বলে রাখা হলো। মালিককে জানানো হয়েছে।')
      : t('Declined. The owner has been told.', 'না বলা হলো। মালিককে জানানো হয়েছে।'));
    close();
  };
  return (
    <Modal open={!!pick} onClose={close} title={r ? `${verb}: ${i.L(r.name)}` : ''}
      foot={<><button type="button" className="btn ghost l" onClick={close}>{t('Cancel', 'বাতিল')}</button><button type="button" className={clsx('btn', ok ? 'pri' : 'danger solid')} onClick={go}>{verb}</button></>}>
      {q ? <p className="meta" style={{ marginBottom: 12 }}>{i.L(REQ[q.kind])}. <ReqWhat q={q} /></p> : null}
      {ok && q && q.kind !== 'name' && r ? (
        <div className="alert info" style={{ marginBottom: 12 }}><Ico n="info" /><div>{t('Make the change in ', 'আগে ')}<Link href={a(`r/${r.id}/settings`)} onClick={close}>{t('Admin settings', 'অ্যাডমিন সেটিংসে')}</Link>{t(' first, then mark it done here.', ' বদলটি করুন, তারপর এখানে হয়ে গেছে চাপুন।')}</div></div>
      ) : null}
      <AreaF full label={t('Message to the owner (optional)', 'মালিকের জন্য বার্তা (ইচ্ছা হলে)')} value={reply} onChange={setReply} rows={3}
        ph={ok ? t('For example: Done. The new name shows everywhere now.', 'যেমন: হয়ে গেছে। নতুন নাম এখন সব জায়গায় দেখা যাচ্ছে।') : t('For example: We need a trade licence with the new name first.', 'যেমন: আগে নতুন নামে ট্রেড লাইসেন্স লাগবে।')} />
    </Modal>
  );
}

/* ---------- one line of the activity log ---------- */
export function ActRow({ x }: { x: Log }) {
  const i = useI(), ago = useAgo(), { db } = usePanel();
  const r = x.rid ? getR(db, x.rid) : undefined;
  return (
    <div className="act">
      <Av name={x.who} sm style={x.role === 'restaurant' && r ? { background: r.theme.deep, color: r.theme.accent } : undefined} />
      <div><b>{x.who}</b> <span style={{ color: 'var(--ink-2)' }}>{logWhat(i.bn, x)}</span>{r ? <span className="meta" style={{ display: 'inline' }}> · {i.L(r.name)}</span> : null}</div>
      <span className="meta">{ago(x.at)}</span>
    </div>
  );
}

/* ---------- add a restaurant ---------- */
export type AddPre = { name?: string; area?: string; phone?: string; person?: string; lead?: string };
const isUname = (u: string) => /^[a-z0-9._-]{3,}$/.test(u);
export function AddRestaurant({ open, onClose, pre }: { open: boolean; onClose: () => void; pre?: AddPre | null }) {
  const i = useI(), t = useT(), router = useRouter(), { me } = usePanel();
  const blank = () => ({ en: pre?.name || '', bn: '', area: pre?.area || C.areas[0].id, plan: 'starter' as Plan, phone: pre?.phone || '', oname: pre?.person || '', contact: pre?.phone || '', u: '' });
  const [f, setF] = useState(blank);
  const [cu, setCu] = useState<string[]>([]);
  const [inv, setInv] = useState<Invite | null>(null);
  const [goTo, setGoTo] = useState('');
  const up = (k: keyof ReturnType<typeof blank>) => (v: string) => setF(o => ({ ...o, [k]: v }));
  const tog = (id: string) => setCu(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));
  const close = () => { setF(blank()); setCu([]); onClose(); }; /* the parent gives this box a new key for each lead */
  const save = () => {
    const en = f.en.trim(), bn = f.bn.trim();
    if (!en) return toast.error(t('Give the restaurant a name.', 'রেস্টুরেন্টের একটি নাম দিন।'));
    const u = f.u.trim().toLowerCase(), db0 = fresh();
    let contact = '';
    if (u) { /* an owner account only when a username is given */
      if (!isUname(u)) return toast.error(t('Username: at least 3 small letters or numbers, no spaces.', 'ইউজারনেম: অন্তত ৩টি ছোট অক্ষর বা সংখ্যা, ফাঁকা ছাড়া।'));
      if (db0.users.some(x => x.u === u)) return toast.error(t('That username is taken.', 'এই ইউজারনেম আগেই নেওয়া।'));
      contact = contactOf(f.contact);
      if (!contact) return toast.error(t('Add the owner’s mobile number (01XXXXXXXXX) or email.', 'মালিকের মোবাইল নম্বর (01XXXXXXXXX) বা ইমেইল দিন।'));
      if (findUser(db0, contact)) return toast.error(t('Someone already uses that number or email.', 'এই নম্বর বা ইমেইল আগেই কেউ ব্যবহার করছেন।'));
    }
    let id = slugOf(en); while (getR(db0, id) || db0.gone[id]) id += '-2';
    const area = C.areas.find(x => x.id === f.area) || C.areas[0], city = C.cities[area.city];
    const near = allR(db0).filter(x => x.area === area.id || x.city === area.city);
    const geo: [number, number] = near.length
      ? [near.reduce((s, x) => s + x.geo[0], 0) / near.length + 0.002, near.reduce((s, x) => s + x.geo[1], 0) / near.length + 0.002] : [23.78, 90.4];
    const now = new Date();
    const r: PR = {
      id, name: { en, bn: bn || en }, mono: monoOf(en), since: now.getFullYear(),
      area: area.id, city: area.city, geo, spot: { en: area.en, bn: area.bn }, address: { en: `${area.en}, ${city.en}`, bn: `${area.bn}, ${city.bn}` },
      phone: f.phone.trim(), cuisines: cu.length ? cu : ['bangladeshi'], theme: { deep: '#14192B', accent: '#F5A300', font: 'sans' },
      tagline: { en: '', bn: '' }, story: { en: '', bn: '' }, rating: 0, reviews: 0, verified: 0, ppl: [300, 700], hours: ['11:00', '23:00'],
      vat: 5, service: 0, seats: 40, fac: [], pay: ['Cash', 'bKash'], plan: f.plan, checked: 0, checkedAt: Date.now(),
      mediaDate: { en: now.toLocaleString('en', { month: 'short', year: 'numeric' }), bn: now.toLocaleString('bn-BD', { month: 'short', year: 'numeric' }) },
      hero: ['in'], gallery: { inside: [], outside: [], kitchen: [], food: [] }, signature: [], cats: [{ id: 'main', en: 'Mains', bn: 'মূল খাবার' }], menu: [], hidden: true,
    };
    if (!addR(r)) return;
    let code: string | false = false;
    if (u) code = addUser({ u, name: f.oname.trim() || `${en} owner`, contact, role: 'restaurant', rid: id });
    if (pre?.lead) mutate(db => {
      const l = db.leads.find(x => x.id === pre.lead); if (!l) return;
      const y = leadFix(l), at = Date.now(), won = stageOf('won').l;
      if (y.stage !== 'won') y.hist.unshift({ at, who: me.name, what: `Moved to ${won.en}`, bn: `“${won.bn}” ধাপে নেওয়া হয়েছে` });
      y.stage = 'won'; y.rid = id; y.upd = at;
      logIn(db, id, { en: `Added lead ${y.name} to Khaoya`, bn: `লিড ${y.name} খাওয়া-তে যোগ করেছেন` });
    });
    toast.success(t(`${en} was added. It starts hidden. Next: its menu.`, `${bn || en} যোগ হয়েছে। শুরুতে লুকানো থাকবে। এরপর: মেনু।`));
    const dest = `/${i.lang}/admin/r/${id}${can('rest.edit', me) ? '/menu' : ''}`;
    close();
    if (code) { setGoTo(dest); setInv({ u: findUser(fresh(), u)!, code }); } else router.push(dest);
  };
  return (
    <>
      <Modal open={open} onClose={close} title={t('Add a restaurant', 'রেস্টুরেন্ট যোগ করুন')} size="wide"
        foot={<><button type="button" className="btn ghost l" onClick={close}>{t('Cancel', 'বাতিল')}</button><button type="button" className="btn pri" onClick={save}>{t('Add restaurant', 'রেস্টুরেন্ট যোগ করুন')}</button></>}>
        <div className="f-grid">
          <TextF label={t('Name (English)', 'নাম (ইংরেজি)')} value={f.en} onChange={up('en')} req />
          <TextF label={t('Name (Bangla)', 'নাম (বাংলা)')} value={f.bn} onChange={up('bn')} bn />
          <SelF label={t('Area', 'এলাকা')} value={f.area} onChange={up('area')} opts={C.areas.map(x => [x.id, `${i.L(x)}, ${i.L(C.cities[x.city])}`])} />
          <SelF label={t('Plan', 'প্ল্যান')} value={f.plan} onChange={up('plan')} opts={(Object.keys(PLANS) as Plan[]).map(k => [k, `${i.L(PLANS[k].name)} · ${i.tk(PLANS[k].price)} ${t('a month', 'মাসে')}`])} />
          <TextF full label={t('Phone', 'ফোন')} value={f.phone} onChange={up('phone')} type="tel" ph="01712 345678" />
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <span className="lbl">{t('Cuisines', 'রান্নার ধরন')}</span>
          <div className="tchips">{C.cuisines.map(c => <button key={c.id} type="button" className={clsx('tchip', cu.includes(c.id) && 'on')} aria-pressed={cu.includes(c.id)} onClick={() => tog(c.id)}>{i.L(c)}</button>)}</div>
        </div>
        <p className="dw-sub" style={{ marginTop: 16 }}>{t('Owner sign-in (you can add it later)', 'মালিকের সাইন-ইন (পরেও যোগ করা যায়)')}</p>
        <div className="f-grid">
          <TextF label={t('Owner’s name', 'মালিকের নাম')} value={f.oname} onChange={up('oname')} />
          <TextF label={t('Owner’s mobile or email', 'মালিকের মোবাইল বা ইমেইল')} value={f.contact} onChange={up('contact')} attr={{ autoCapitalize: 'off', spellCheck: false, inputMode: 'email' }} />
          <TextF full label={t('Username', 'ইউজারনেম')} value={f.u} onChange={up('u')} hint={t('Leave empty to skip. They get a 6-digit invite code and choose their own password.', 'বাদ দিতে খালি রাখুন। তাঁরা একটি ৬ সংখ্যার আমন্ত্রণ কোড পাবেন আর নিজের পাসওয়ার্ড বাছবেন।')} attr={{ autoCapitalize: 'off', spellCheck: false }} />
        </div>
        <div className="alert info" style={{ marginTop: 14 }}><Ico n="info" /><div className="meta">{t('New restaurants start hidden. Add the menu and photos, then switch it live in Admin settings.', 'নতুন রেস্টুরেন্ট শুরুতে লুকানো থাকে। মেনু আর ছবি যোগ করুন, তারপর অ্যাডমিন সেটিংসে চালু করুন।')}</div></div>
      </Modal>
      <InviteCard inv={inv} onClose={() => { setInv(null); if (goTo) { router.push(goTo); setGoTo(''); } }} />
    </>
  );
}

/** a small card header with a title and things on the right */
export function CardH({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return <div className="card-h"><h2>{title}</h2>{children}</div>;
}
