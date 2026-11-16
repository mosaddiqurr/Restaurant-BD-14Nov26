'use client';
/* Team & account (owners): requests to the khabo team with their answers, the people who can sign in for this
   restaurant, and changing your own password. Ported from website/panel/rest.js (V.team, reqList). */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { cancelRequest, checkPw, fresh, reinvite, removeUser, requestsOf, seeReplies, setPassword } from '@/lib/panel/store';
import { REQ, REQ_STATE } from '@/lib/panel/words';
import { AskKhabo } from '../ask';
import { InviteCard, UserModal, type Invite } from '../users';
import { Av, Empty, Ico, Page, TextF, confirm, useAgo, useR, useT } from '../ui';

const stamp = () => Date.now();

export function Team() {
  const i = useI(), t = useT(), ago = useAgo(), { r, db, me } = useR();
  const [add, setAdd] = useState(false), [inv, setInv] = useState<Invite | null>(null), [ask, setAsk] = useState(false);
  const [pw, setPw] = useState({ now: '', next: '' });
  const [now] = useState(stamp);
  const team = db.users.filter(u => u.rid === r.id);
  const reqs = requestsOf(db, r.id).slice(0, 12);
  /* opening this page marks the khabo team's answers as seen */
  useEffect(() => { if (me.role === 'restaurant') seeReplies(r.id); }, [me.role, r.id]);
  useEffect(() => { if (location.hash === '#requests') document.getElementById('requests')?.scrollIntoView(); }, []);
  const changePw = (e: React.FormEvent) => {
    e.preventDefault();
    const u = fresh().users.find(x => x.u === me.u);
    if (!checkPw(u, pw.now)) return toast.error(t('Your current password is not right.', 'আপনার এখনকার পাসওয়ার্ড ঠিক নয়।'));
    if (pw.next.length < 6) return toast.error(t('Use at least 6 characters.', 'অন্তত ৬ অক্ষর দিন।'));
    setPassword(me.u, pw.next); setPw({ now: '', next: '' }); toast.success(t('Password updated.', 'পাসওয়ার্ড বদলানো হয়েছে।'));
  };
  return (
    <Page title={t('Team & account', 'টিম ও অ্যাকাউন্ট')} sub={t('People who can sign in and change this restaurant.', 'যাঁরা সাইন ইন করে এই রেস্টুরেন্ট বদলাতে পারেন।')}
      acts={<button className="btn pri" onClick={() => setAdd(true)}><Ico n="plus" sm />{t('Add a team member', 'টিমে একজন যোগ করুন')}</button>}>
      <div className="card" id="requests" style={{ marginBottom: 16 }}>
        <div className="card-h"><h2>{t('Requests to khabo', 'খাবোর কাছে অনুরোধ')}</h2><span className="r"><button className="btn sm" onClick={() => setAsk(true)}><Ico n="paper-plane-right" sm />{t('Ask for a change', 'বদলাতে বলুন')}</button></span></div>
        <div className="rows" style={{ padding: '4px 0' }}>
          {reqs.length ? reqs.map(q => {
            const [lbl, cls] = REQ_STATE[q.state];
            return (
              <div key={q.id} className="row rq">
                <span className="av sm"><Ico n={q.state === 'done' ? 'check' : q.state === 'open' ? 'clock' : 'x'} sm /></span>
                <div><b>{i.L(REQ[q.kind])}</b>
                  <span className="rq-w">{q.kind === 'name' ? t(`New name: “${q.data.en}”`, `নতুন নাম: “${q.data.bn || q.data.en}”`) : q.data.text}</span>
                  <span className="meta">{t(`Asked ${ago(q.at)}`, `চাওয়া হয়েছে ${ago(q.at)}`)}{q.state !== 'open' && q.doneAt ? ` · ${t(`answered ${ago(q.doneAt)}`, `উত্তর ${ago(q.doneAt)}`)}` : ''}</span>
                  {q.reply ? <span className="rq-reply"><Ico n="chat-circle-dots" sm /><span><b>{t('khabo:', 'খাবো:')}</b> {q.reply}</span></span> : null}
                </div>
                <span className="rq-a"><span className={`badge ${cls}`}>{i.L(lbl)}</span>
                  {q.state === 'open' ? <button className="btn sm ghost" onClick={async () => {
                    if (await confirm({ title: t('Cancel this request?', 'এই অনুরোধ বাতিল করবেন?'), text: t('The khabo team will no longer see it.', 'খাবো টিম আর এটা দেখবে না।'), ok: t('Cancel request', 'অনুরোধ বাতিল') }) && cancelRequest(q.id)) toast.success(t('Request cancelled.', 'অনুরোধ বাতিল হয়েছে।'));
                  }}>{t('Cancel', 'বাতিল')}</button> : null}</span>
              </div>
            );
          }) : <Empty icon="paper-plane-right" title={t('No requests yet', 'এখনো কোনো অনুরোধ নেই')}>{t('Need a new name, area, web address or a new 360 shoot? Ask here.', 'নতুন নাম, এলাকা, ওয়েব ঠিকানা বা নতুন ৩৬০ ছবি দরকার? এখানে বলুন।')}</Empty>}
        </div>
      </div>
      <div className="grid g-main">
        <div className="card"><div className="rows">
          {team.map(u => {
            const pending = !u.hash && u.p == null;
            return (
              <div key={u.u} className="row"><Av name={u.name} />
                <div><b>{u.name}{u.u === me.u ? <> <span className="badge ind">{t('You', 'আপনি')}</span></> : null}{pending && u.inv ? <> <span className="badge warn">{now > u.inv.exp ? t('Invite ran out', 'আমন্ত্রণের মেয়াদ শেষ') : t('Invited', 'আমন্ত্রিত')}</span></> : null}</b>
                  <span className="meta">{u.u}{u.contact ? ` · ${u.contact}` : ''} · {pending ? t('Has not joined yet', 'এখনো যোগ দেননি') : u.active ? (u.last ? t(`Last signed in ${ago(u.last)}`, `শেষ সাইন ইন ${ago(u.last)}`) : t('Never signed in', 'কখনো সাইন ইন করেননি')) : t('Turned off', 'বন্ধ')}</span></div>
                {u.u === me.u ? <span /> : (
                  <span style={{ display: 'flex', gap: 6 }}>
                    {pending ? <button className="btn sm" onClick={() => { const c = reinvite(u.u); if (c) setInv({ u, code: c }); }}>{t('New code', 'নতুন কোড')}</button> : null}
                    <button className="btn sm danger" onClick={async () => {
                      if (!await confirm({ title: t(`Remove ${u.u}?`, `${u.u}-কে সরাবেন?`), text: t('They will not be able to sign in any more.', 'তাঁরা আর সাইন ইন করতে পারবেন না।'), ok: t('Remove', 'সরান'), danger: true })) return;
                      if (removeUser(u.u)) toast.success(t('Team member removed.', 'টিম সদস্যকে সরানো হয়েছে।'));
                    }}>{t('Remove', 'সরান')}</button>
                  </span>
                )}
              </div>
            );
          })}
        </div></div>
        {me.rid === r.id ? (
          <form className="card" noValidate onSubmit={changePw}>
            <div className="card-h"><h2>{t('Change your password', 'আপনার পাসওয়ার্ড বদলান')}</h2></div>
            <div className="card-b stack">
              <TextF type="password" label={t('Current password', 'এখনকার পাসওয়ার্ড')} value={pw.now} onChange={v => setPw(o => ({ ...o, now: v }))} attr={{ autoComplete: 'current-password' }} />
              <TextF type="password" label={t('New password', 'নতুন পাসওয়ার্ড')} value={pw.next} onChange={v => setPw(o => ({ ...o, next: v }))} hint={t('At least 6 characters', 'অন্তত ৬ অক্ষর')} attr={{ autoComplete: 'new-password' }} />
              <button className="btn pri" style={{ justifySelf: 'start' }}>{t('Update password', 'পাসওয়ার্ড বদলান')}</button>
            </div>
          </form>
        ) : <div className="alert info"><Ico n="info" /><div><b>{t('Only the owner changes their own password', 'শুধু মালিক নিজের পাসওয়ার্ড বদলান')}</b><div className="meta">{t('The khabo team can reset an account to a new invite code under Team & users.', 'খাবো টিম "টিম ও ব্যবহারকারী" থেকে অ্যাকাউন্টকে নতুন আমন্ত্রণ কোডে রিসেট করতে পারে।')}</div></div></div>}
      </div>
      <UserModal open={add} onClose={() => setAdd(false)} rid={r.id} lockRole done={x => setInv(x)} />
      <InviteCard inv={inv} onClose={() => setInv(null)} />
      <AskKhabo open={ask} onClose={() => setAsk(false)} />
    </Page>
  );
}
