'use client';
/* Adding a person and handing over their invite code. Used by owners (their own team) and by the khabo team.
   Nobody ever sets a password for someone else: a new account gets a 6-digit code that works once, for 3 days. */
import { useState } from 'react';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { areaOf } from '@/lib/khabo';
import { addUser, allR, can, contactOf, findUser, fresh, INVITE_DAYS, type User } from '@/lib/panel/store';
import { LEVELS, type Level } from '@/lib/panel/words';
import { copyText, Ico, Modal, SelF, TextF, usePanel, useT } from './ui';

export type Invite = { u: User; code: string };

/** "Add a team member" (owners) or "Add a user" (khabo team). Calls done() with the new invite */
export function UserModal({ open, onClose, rid, lockRole, done }: { open: boolean; onClose: () => void; rid?: string; lockRole?: boolean; done: (x: Invite) => void }) {
  const i = useI(), t = useT(), { me, db } = usePanel();
  const owner = me.role !== 'admin';
  const rs = allR(db).slice().sort((a, b) => a.name.en.localeCompare(b.name.en));
  const [f, setF] = useState({ name: '', contact: '', u: '', role: rid ? 'restaurant' : 'support', rid: rid || rs[0]?.id || '' });
  const up = (k: keyof typeof f) => (v: string) => setF(o => ({ ...o, [k]: v }));
  const showRole = !owner && !lockRole && can('users.admin', me);
  const showRest = !owner && (f.role === 'restaurant' || !can('users.admin', me));
  const close = () => { onClose(); setF({ name: '', contact: '', u: '', role: rid ? 'restaurant' : 'support', rid: rid || rs[0]?.id || '' }); };
  const save = () => {
    const u = f.u.trim().toLowerCase();
    const r = owner ? me.rid : f.role === 'restaurant' || !can('users.admin', me) ? f.rid || rid : undefined;
    if (!f.name.trim()) return toast.error(t('Add their name.', 'তাঁর নাম লিখুন।'));
    if (!/^[a-z0-9._-]{3,}$/.test(u)) return toast.error(t('Username: at least 3 small letters or numbers, no spaces.', 'ইউজারনেম: অন্তত ৩টি ছোট অক্ষর বা সংখ্যা, ফাঁকা ছাড়া।'));
    const db0 = fresh();
    if (db0.users.some(x => x.u === u)) return toast.error(t('That username is taken.', 'এই ইউজারনেম আগেই নেওয়া।'));
    const contact = contactOf(f.contact);
    if (!contact) return toast.error(t('Add their mobile number (01XXXXXXXXX) or email.', 'তাঁর মোবাইল নম্বর (01XXXXXXXXX) বা ইমেইল দিন।'));
    if (findUser(db0, contact)) return toast.error(t('Someone already uses that number or email.', 'এই নম্বর বা ইমেইল আগেই কেউ ব্যবহার করছেন।'));
    const x = { u, name: f.name.trim(), contact, role: (r ? 'restaurant' : 'admin') as User['role'], level: r ? undefined : (f.role as Level), rid: r || undefined };
    const code = addUser(x); if (!code) return;
    const nu = findUser(fresh(), u)!;
    close(); done({ u: nu, code });
  };
  return (
    <Modal open={open} onClose={close} title={owner ? t('Add a team member', 'টিমে একজন যোগ করুন') : t('Add a user', 'ব্যবহারকারী যোগ করুন')}
      foot={<><button className="btn ghost l" onClick={close}>{t('Cancel', 'বাতিল')}</button><button className="btn pri" onClick={save}>{t('Create invite', 'আমন্ত্রণ তৈরি করুন')}</button></>}>
      <div className="f-grid">
        <TextF full label={t('Full name', 'পুরো নাম')} value={f.name} onChange={up('name')} req />
        <TextF label={t('Mobile number or email', 'মোবাইল নম্বর বা ইমেইল')} value={f.contact} onChange={up('contact')} hint={t('Their own. They can sign in with it, and in the real build the invite code is sent here.', 'তাঁর নিজের। এটা দিয়ে সাইন ইন করা যাবে, আর আসল সংস্করণে আমন্ত্রণ কোড এখানেই যাবে।')} attr={{ autoCapitalize: 'off', spellCheck: false, inputMode: 'email' }} />
        <TextF label={t('Username', 'ইউজারনেম')} value={f.u} onChange={up('u')} hint={t('Small letters and numbers', 'ছোট অক্ষর আর সংখ্যা')} attr={{ autoCapitalize: 'off', spellCheck: false }} />
        {showRole ? <SelF full label={t('Account type', 'অ্যাকাউন্টের ধরন')} value={f.role} onChange={up('role')}
          opts={[['restaurant', t('Restaurant (one restaurant only)', 'রেস্টুরেন্ট (শুধু একটি রেস্টুরেন্ট)')], ...(Object.keys(LEVELS) as Level[]).map(k => [k, `${t('khabo team', 'খাবো টিম')} · ${i.L(LEVELS[k].name)}: ${i.L(LEVELS[k].note)}`] as [string, string])]} /> : null}
        {showRest ? <SelF full label={t('Restaurant', 'রেস্টুরেন্ট')} value={f.rid} onChange={up('rid')} opts={rs.map(r => [r.id, `${i.L(r.name)} · ${i.L(areaOf(r.area))}`])} /> : null}
      </div>
      <p className="meta">{owner ? t(`They will be able to change ${allR(db).find(r => r.id === me.rid)?.name.en || ''} only. `, `তাঁরা শুধু ${allR(db).find(r => r.id === me.rid)?.name.bn || ''} বদলাতে পারবেন। `) : ''}
        {t('You will get a 6-digit invite code for them. They sign in with it once and choose their own password, so nobody else ever knows it.', 'তাঁর জন্য একটি ৬ সংখ্যার আমন্ত্রণ কোড পাবেন। তাঁরা একবার এটা দিয়ে সাইন ইন করে নিজের পাসওয়ার্ড বাছবেন, তাই আর কেউ সেটা জানবে না।')}</p>
    </Modal>
  );
}

/** the code is shown once, with a ready message to send on WhatsApp or SMS */
export function InviteCard({ inv, onClose }: { inv: Invite | null; onClose: () => void }) {
  const i = useI(), t = useT(), { db } = usePanel();
  const u = inv?.u, code = inv?.code || '';
  const rname = u?.rid ? allR(db).find(r => r.id === u.rid)?.name : null;
  const link = typeof location !== 'undefined' ? `${location.origin}/${i.lang}/${u?.role === 'admin' ? 'admin' : 'partner'}` : '';
  const first = u ? u.name.split(' ')[0] : '';
  const msg = !u ? '' : i.bn
    ? `${first}, আপনাকে খাবো প্যানেলে আমন্ত্রণ জানানো হয়েছে${rname ? ` (${rname.bn})` : ''}। ${link} খুলুন, "আমার কাছে আমন্ত্রণ কোড আছে" চাপুন, ${u.contact || u.u} আর কোড ${code} লিখুন। কোডটি ${i.N(INVITE_DAYS)} দিন কাজ করবে।`
    : `Hi ${first}, you are invited to the khabo panel${rname ? ` for ${rname.en}` : ''}. Open ${link}, tap "I have an invite code", type ${u.contact || u.u} and the code ${code}. The code works for ${INVITE_DAYS} days.`;
  const wa = u && /^\+880/.test(u.contact || '') ? `https://wa.me/${u.contact!.slice(1)}?text=${encodeURIComponent(msg)}` : null;
  return (
    <Modal open={!!inv} onClose={onClose} title={u ? t(`Invite for ${u.name}`, `${u.name}-এর আমন্ত্রণ`) : ''}
      foot={<><button className="btn ghost l" onClick={onClose}>{t('Done', 'হয়েছে')}</button>
        {wa ? <a className="btn" href={wa} target="_blank" rel="noopener"><Ico n="whatsapp-logo" sm />WhatsApp</a> : null}
        <button className="btn pri" onClick={() => copyText(msg, t('Message copied.', 'বার্তা কপি হয়েছে।'))}><Ico n="copy" sm />{t('Copy message', 'বার্তা কপি করুন')}</button></>}>
      <div className="inv"><span className="meta">{t('Invite code', 'আমন্ত্রণ কোড')}</span><b className="num">{code.slice(0, 3)} {code.slice(3)}</b>
        <span className="meta">{t(`Works for ${INVITE_DAYS} days, once. You will not see it again.`, `${i.N(INVITE_DAYS)} দিন, একবার কাজ করবে। আর দেখতে পাবেন না।`)}</span></div>
      <p className="meta">{t(`Send them this message. In the real build khabo sends the code to ${u?.contact || 'them'} by itself.`, `তাঁকে এই বার্তা পাঠান। আসল সংস্করণে খাবো নিজেই ${u?.contact || 'তাঁকে'} কোড পাঠাবে।`)}</p>
      <textarea className="inp" rows={4} readOnly value={msg} />
    </Modal>
  );
}
