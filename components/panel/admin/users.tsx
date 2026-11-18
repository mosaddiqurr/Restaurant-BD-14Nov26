'use client';
/* Team & users: everyone who can sign in. Restaurant accounts only see their own restaurant; the khabo team
   has levels and only a Master can manage team accounts. Turn on or off, change level, unlock, a new invite
   code instead of a password, remove. Ported from archive/prototype/panel/admin.js (V.users). */
import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import {
  can, canManage, getR, isLastMaster, levelName, reinvite, removeUser, resetToInvite, updateUser, type User,
} from '@/lib/panel/store';
import { LEVELS, type Level } from '@/lib/panel/words';
import { InviteCard, UserModal, type Invite } from '../users';
import { Av, Ico, MonoR, Page, Sw, confirm, useAgo, usePanel, useT } from '../ui';
import { useA, useNow } from './parts';

export function Users() {
  const i = useI(), t = useT(), ago = useAgo(), a = useA(), { db, me } = usePanel();
  const [add, setAdd] = useState(false);
  const [inv, setInv] = useState<Invite | null>(null);
  const us = db.users.slice().sort((x, y) => (x.role === y.role ? 0 : x.role === 'admin' ? -1 : 1) || x.u.localeCompare(y.u));
  const shown = us.filter(u => u.role === 'admin' || can('users.rest', me) || can('users.admin', me));
  const now = useNow();

  const setActive = (u: User, on: boolean) => {
    const ok = updateUser(u.u, on ? { active: true } : { active: false, sv: (u.sv || 0) + 1 },
      on ? { en: `Turned on user ${u.u}`, bn: `${u.u} ব্যবহারকারীকে চালু করেছেন` } : { en: `Turned off user ${u.u}`, bn: `${u.u} ব্যবহারকারীকে বন্ধ করেছেন` });
    if (ok) toast.success(on ? t(`${u.u} can sign in again.`, `${u.u} আবার সাইন ইন করতে পারবেন।`) : t(`${u.u} can no longer sign in and was signed out.`, `${u.u} আর সাইন ইন করতে পারবেন না, সাইন আউটও হয়ে গেছেন।`));
  };
  const setLevel = (u: User, lv: Level) => {
    const n = LEVELS[lv].name;
    if (updateUser(u.u, { level: lv, sv: (u.sv || 0) + 1 }, { en: `Made ${u.u} a ${n.en} (level)`, bn: `${u.u}-কে ${n.bn} লেভেলে দিয়েছেন` }))
      toast.success(t(`${u.u} is now ${n.en}. They need to sign in again.`, `${u.u} এখন ${n.bn}। তাঁকে আবার সাইন ইন করতে হবে।`));
  };
  const unlock = (u: User) => {
    if (updateUser(u.u, { lockUntil: 0 }, { en: `Unlocked ${u.u} (account)`, bn: `${u.u} অ্যাকাউন্টটি খুলে দিয়েছেন` })) toast.success(t(`${u.u} can try again.`, `${u.u} আবার চেষ্টা করতে পারবেন।`));
  };
  const newCode = async (u: User) => {
    const invited = !u.hash && !!u.inv;
    if (invited) { const c = reinvite(u.u); if (c) setInv({ u, code: c }); return; }
    if (!await confirm({ title: t(`New invite code for ${u.u}?`, `${u.u}-এর জন্য নতুন আমন্ত্রণ কোড?`), text: t(`${u.name} is signed out everywhere, their old password stops working, and they choose a new one with the code.`, `${u.name} সব জায়গা থেকে সাইন আউট হবেন, পুরোনো পাসওয়ার্ড আর কাজ করবে না, আর কোড দিয়ে নতুন পাসওয়ার্ড বাছবেন।`), ok: t('Make a new code', 'নতুন কোড তৈরি করুন') })) return;
    const c = resetToInvite(u.u); if (c) setInv({ u, code: c });
  };
  const remove = async (u: User) => {
    if (!await confirm({ title: t(`Remove ${u.u}?`, `${u.u}-কে সরাবেন?`), text: t(`${u.name} will not be able to sign in. This cannot be undone.`, `${u.name} আর সাইন ইন করতে পারবেন না। এটা ফেরানো যাবে না।`), ok: t('Remove user', 'ব্যবহারকারী সরান'), danger: true })) return;
    if (removeUser(u.u)) toast.success(t('User removed.', 'ব্যবহারকারীকে সরানো হয়েছে।'));
  };

  return (
    <Page title={t('Team & users', 'টিম ও ব্যবহারকারী')}
      sub={t('Everyone who can sign in. Restaurant accounts only see their own restaurant. The Khaoya team has levels; only a Master can manage team accounts.', 'যাঁরা সাইন ইন করতে পারেন, সবাই। রেস্টুরেন্টের অ্যাকাউন্ট শুধু নিজের রেস্টুরেন্ট দেখে। খাওয়া টিমের লেভেল আছে; টিমের অ্যাকাউন্ট শুধু মাস্টার সামলাতে পারেন।')}
      acts={<button type="button" className="btn pri" onClick={() => setAdd(true)}><Ico n="plus" sm />{can('users.admin', me) ? t('Add user', 'ব্যবহারকারী যোগ করুন') : t('Add restaurant account', 'রেস্টুরেন্টের অ্যাকাউন্ট যোগ করুন')}</button>}>
      <div className="lv-grid">
        {(Object.keys(LEVELS) as Level[]).map(k => (
          <div className="card lv" key={k}><b>{i.L(LEVELS[k].name)}</b><span className="meta">{i.L(LEVELS[k].note)}</span>
            <span className="lv-n">{i.N(us.filter(u => u.role === 'admin' && (u.level || 'master') === k).length)}</span></div>
        ))}
      </div>
      <div className="card ad-gap">
        <div className="tbl-wrap">
          <table className="tbl tbl-m us-tbl">
            <thead><tr><th>{t('User', 'ব্যবহারকারী')}</th><th>{t('Level', 'লেভেল')}</th><th>{t('Can change', 'যা বদলাতে পারেন')}</th><th>{t('Last signed in', 'শেষ সাইন ইন')}</th><th>{t('Active', 'চালু')}</th><th><span className="sr">{t('Actions', 'কাজ')}</span></th></tr></thead>
            <tbody>
              {shown.map(u => {
                const self = u.u === me.u, last = isLastMaster(db, u), mng = canManage(u, me), ok = mng && !self && !last;
                const locked = (u.lockUntil || 0) > now, invited = !u.hash && !!u.inv && u.p == null, r = u.rid ? getR(db, u.rid) : undefined;
                return (
                  <tr key={u.u}>
                    <td className="who-td"><div className="who"><Av name={u.name} /><div>
                      <b className="us-n">{u.name}{self ? <span className="badge ind you">{t('You', 'আপনি')}</span> : null}{locked ? <span className="badge bad you">{t('Locked', 'বন্ধ আছে')}</span> : null}</b>
                      <span className="meta">{u.u}{u.contact ? ` · ${u.contact}` : ''}</span></div></div></td>
                    <td data-k={t('Level', 'লেভেল')}>{u.role === 'admin' ? <span className={clsx('badge', (u.level || 'master') === 'master' ? 'gold' : 'ind')}>{i.L(levelName(u))}</span> : <span className="badge">{t('Restaurant', 'রেস্টুরেন্ট')}</span>}</td>
                    <td className="us-can" data-k={t('Can change', 'যা বদলাতে পারেন')}>{u.role === 'admin' ? <span className="meta">{i.L(LEVELS[u.level || 'master'].note)}</span>
                      : r ? <Link href={a(`r/${r.id}`)} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><MonoR r={r} cls="sm" />{i.L(r.name)}</Link>
                        : <span className="meta">{t('Deleted restaurant', 'মুছে ফেলা রেস্টুরেন্ট')}</span>}</td>
                    <td className="meta" data-k={t('Last', 'শেষ')}>{invited ? <span className="badge warn">{t('Invited', 'আমন্ত্রিত')}</span> : u.last ? ago(u.last) : t('Never', 'কখনো না')}</td>
                    <td className="us-sw"><Sw on={u.active} disabled={!ok} onChange={v => setActive(u, v)} label={t(`${u.u} can sign in`, `${u.u} সাইন ইন করতে পারেন`)} /></td>
                    <td className="r end us-end">
                      {mng ? (
                        <span className="us-acts">
                          {u.role === 'admin' && can('users.admin', me) && !self && !last ? (
                            <select className="sel sm" value={u.level || 'master'} onChange={e => setLevel(u, e.target.value as Level)} aria-label={t(`Level for ${u.u}`, `${u.u}-এর লেভেল`)}>
                              {(Object.keys(LEVELS) as Level[]).map(k => <option key={k} value={k}>{i.L(LEVELS[k].name)}</option>)}
                            </select>
                          ) : null}
                          {locked ? <button type="button" className="btn sm ghost" onClick={() => unlock(u)}>{t('Unlock', 'খুলে দিন')}</button> : null}
                          {!self ? <button type="button" className="btn sm ghost" onClick={() => newCode(u)}>{invited ? t('New invite code', 'নতুন আমন্ত্রণ কোড') : t('Reset password', 'পাসওয়ার্ড রিসেট')}</button> : null}
                          {ok ? <button type="button" className="ibtn sm" onClick={() => remove(u)} aria-label={t(`Remove ${u.u}`, `${u.u}-কে সরান`)}><Ico n="trash" sm /></button> : null}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="alert info ad-gap"><Ico n="shield-check" /><div><b>{t('How sign-in is protected', 'সাইন-ইন যেভাবে সুরক্ষিত')}</b>
        <div className="meta">{t('Passwords are stored salted and hashed, never as typed. Nobody sets a password for someone else: new people and resets get a 6-digit invite code. Five wrong tries lock an account for 10 minutes. The Khaoya team is signed out after 30 minutes without activity, and a new password signs the person out everywhere. Every page and every change is checked against the person’s level. In the real product this all runs on the server, with a phone code as a second step for the Khaoya team.',
          'পাসওয়ার্ড লবণ মিশিয়ে হ্যাশ করে রাখা হয়, লেখা অবস্থায় কখনো না। কেউ অন্য কারো পাসওয়ার্ড ঠিক করে না: নতুন মানুষ আর রিসেটে আসে ৬ সংখ্যার আমন্ত্রণ কোড। পাঁচবার ভুল হলে অ্যাকাউন্ট ১০ মিনিট বন্ধ থাকে। খাওয়া টিম ৩০ মিনিট কিছু না করলে সাইন আউট হয়ে যায়, আর নতুন পাসওয়ার্ড দিলে সব জায়গা থেকে সাইন আউট হয়। প্রতিটি পেজ আর প্রতিটি বদল সেই মানুষের লেভেল দেখে যাচাই হয়। আসল পণ্যে এসব সার্ভারে চলবে, খাওয়া টিমের জন্য দ্বিতীয় ধাপে ফোন কোডসহ।')}</div></div></div>
      <UserModal open={add} onClose={() => setAdd(false)} done={x => setInv(x)} />
      <InviteCard inv={inv} onClose={() => setInv(null)} />
    </Page>
  );
}
