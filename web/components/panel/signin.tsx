'use client';
/* Sign in for partner restaurants and the khabo team (ported from website/panel/app.js loginPage).
   Demo accounts are listed so the founder can try every level. The real build signs in on the server. */
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { Logo } from '@/components/ui/bits';
import { src } from '@/lib/khabo';
import { acceptInvite, allR, announceSignIn, can, fresh, getR, openRequests, signIn, type PanelDB } from '@/lib/panel/store';
import { LEVELS } from '@/lib/panel/words';
import { Ico, MonoR, useT } from './ui';
import { LangThemeBtns } from './shell';

const PICS = ['in', 'i4', 'kt', 'di', 'i3', 'bw', 'i2', 'ch', 'iA', 'fu', 'i5', 'b4', 'iB', 'th', 'iC', 'pl', 'ro', 'na'];

export function SignIn({ db, area }: { db: PanelDB; area: 'partner' | 'admin' }) {
  const i = useI(), t = useT();
  const [u, setU] = useState(''), [p, setP] = useState(''), [code, setCode] = useState(''), [keep, setKeep] = useState(true);
  const [inv, setInv] = useState(false), [show, setShow] = useState(false), [err, setErr] = useState(''), [shake, setShake] = useState(0);
  const pRef = useRef<HTMLInputElement>(null), uRef = useRef<HTMLInputElement>(null);
  const list = allR(db);
  const accts = useMemo(() => [
    { u: 'admin', name: t('khabo team · Master', 'খাবো টিম · মাস্টার'), s: t('Everything', 'সবকিছু'), r: null },
    ...db.users.filter(x => ['client1', 'client2', 'client3'].includes(x.u) && getR(db, x.rid)).map(x => { const r = getR(db, x.rid)!; return { u: x.u, name: i.L(r.name), s: t('Only this restaurant', 'শুধু এই রেস্টুরেন্ট'), r }; }),
  ], [db, i, t]);
  const exists = (rid: string) => list.some(r => r.id === rid);
  const fail = (m: string) => { setErr(m); setShake(k => k + 1); pRef.current?.select(); };
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!u || !p || (inv && !code)) return fail(inv ? t('Enter your username, mobile or email, the code and a new password.', 'ইউজারনেম, মোবাইল বা ইমেইল, কোড আর নতুন পাসওয়ার্ড লিখুন।') : t('Enter your username and password.', 'ইউজারনেম আর পাসওয়ার্ড লিখুন।'));
    const res = inv ? acceptInvite(u, code, p, keep, exists) : signIn(u, p, keep, exists);
    if (res.error) return fail(i.L(res.error));
    setErr(''); announceSignIn();
    const n = res.user.role === 'admin' && can('rest.admin', res.user) ? openRequests(fresh()).length : 0;
    if (n) toast(t(`${n} request${n > 1 ? 's' : ''} from restaurants waiting for you.`, `রেস্টুরেন্টের ${i.N(n)}টি অনুরোধ আপনার অপেক্ষায়।`));
  };
  /* eslint-disable-next-line @next/next/no-img-element */
  const col = (k: number) => { const s = PICS.filter((_, j) => j % 3 === k); return <div className="lg-col">{[...s, ...s].map((id, j) => <img key={j} src={src(id, 360)} alt="" loading="lazy" />)}</div>; };
  const fill = (a: string) => { setU(a); setP(a); setInv(false); setErr(''); };
  return (
    <main className="login">
      <section className="lg-art" aria-hidden="true">
        <div className="lg-wall">{col(0)}{col(1)}{col(2)}</div>
        <div className="lg-brand"><Logo /><span>khabo</span></div>
        <div className="lg-say">
          <h2>{t('Your restaurant, kept up to date in minutes.', 'আপনার রেস্টুরেন্ট, কয়েক মিনিটেই হালনাগাদ।')}</h2>
          <p>{t('Change prices, mark dishes sold out, answer reviews and print table QR cards. Every change shows on khabo straight away.', 'দাম বদলান, শেষ হয়ে যাওয়া খাবার চিহ্নিত করুন, রিভিউর উত্তর দিন আর টেবিলের কিউআর কার্ড প্রিন্ট করুন। প্রতিটি বদল সঙ্গে সঙ্গে খাবোতে দেখা যায়।')}</p>
        </div>
      </section>
      <section className="lg-form">
        <div className="lg-tools"><LangThemeBtns /></div>
        <form className="lg-box" noValidate onSubmit={go}>
          <h1>{inv ? t('Join your team', 'আপনার টিমে যোগ দিন') : t('Sign in', 'সাইন ইন')}</h1>
          <p>{area === 'admin' ? t('For the khabo team and khabo partner restaurants.', 'খাবো টিম আর খাবোর পার্টনার রেস্টুরেন্টের জন্য।') : t('For khabo partner restaurants and the khabo team.', 'খাবোর পার্টনার রেস্টুরেন্ট আর খাবো টিমের জন্য।')}</p>
          <div className="lg-fields">
            <div key={shake} className={err ? 'lg-err on' : 'lg-err'} role="alert"><Ico n="warning" sm /><span>{err}</span></div>
            <div className="field"><label htmlFor="lg-u">{t('Username, mobile or email', 'ইউজারনেম, মোবাইল বা ইমেইল')}</label>
              <input ref={uRef} className="inp" id="lg-u" name="u" value={u} onChange={e => setU(e.target.value)} autoComplete="username" autoCapitalize="off" spellCheck={false} autoFocus /></div>
            {inv ? (
              <div className="field"><label htmlFor="lg-code">{t('Invite code', 'আমন্ত্রণ কোড')}</label>
                <input className="inp num" id="lg-code" name="code" value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder={t('6 digits', '৬ সংখ্যা')} /></div>
            ) : null}
            <div className="field"><label htmlFor="lg-p">{inv ? t('Choose a password', 'একটি পাসওয়ার্ড বাছুন') : t('Password', 'পাসওয়ার্ড')}</label>
              <div className="pwd"><input ref={pRef} className="inp" id="lg-p" name="p" type={show ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)} autoComplete={inv ? 'new-password' : 'current-password'} />
                <button type="button" className="ibtn sm" onClick={() => setShow(!show)} aria-label={show ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}><Ico n="eye" sm f={show} /></button></div></div>
            <div className="lg-row"><label className="check"><input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)} /> {t('Keep me signed in', 'সাইন ইন থাকুক')}</label></div>
            <button className="btn pri lg" type="submit"><span>{inv ? t('Set password and sign in', 'পাসওয়ার্ড দিয়ে সাইন ইন') : t('Sign in', 'সাইন ইন')}</span><Ico n="arrow-right" sm /></button>
            <button type="button" className="lg-inv" onClick={() => { setInv(!inv); setErr(''); uRef.current?.focus(); }}>{inv ? t('I already have a password', 'আমার পাসওয়ার্ড আছে') : t('I have an invite code', 'আমার কাছে আমন্ত্রণ কোড আছে')}</button>
          </div>
          <div className="lg-demo">
            <h3>{t('Test accounts for this prototype (tap to fill)', 'এই প্রোটোটাইপের পরীক্ষার অ্যাকাউন্ট (চাপলে বসে যাবে)')}</h3>
            <div className="lg-accts">
              {accts.map(a => (
                <button key={a.u} type="button" className="lg-acct" onClick={() => fill(a.u)}>
                  {a.r ? <MonoR r={a.r} /> : <span className="mono" style={{ '--d': '#0C5A3E', '--a': '#fff' } as CSSProperties}><Ico n="shield-check" sm /></span>}
                  <span><b>{a.name}</b><span className="meta">{a.s}</span></span><code>{a.u} / {a.u}</code>
                </button>
              ))}
            </div>
            <div className="lg-lv"><span className="meta">{t('Other khabo team levels:', 'খাবো টিমের অন্য লেভেল:')}</span>
              {(['manager', 'support', 'sales', 'finance'] as const).map(l => <button key={l} type="button" className="lg-acct sm" title={i.L(LEVELS[l].note)} onClick={() => fill(l)}><code>{l} / {l}</code></button>)}
            </div>
          </div>
          <Link className="lg-back" href={`/${i.lang}`}><Ico n="arrow-left" sm />{t('Back to khabo', 'খাবোতে ফিরে যান')}</Link>
        </form>
      </section>
    </main>
  );
}
