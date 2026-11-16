'use client';
/* Sign in with a phone number and a 6-digit code (a preview: any 6 digits work). Diners never need an
   account to browse; it only adds reviews and saved bills. After signing in, whatever asked for it carries on. */
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';
import { OTPInput, type SlotProps } from 'input-otp';
import { AnimatePresence, m, useAnimate } from 'motion/react';
import { toast } from '@/lib/toast';
import { useI } from '@/components/providers/i18n';
import { takePending } from '@/components/cards/actions';
import { useApp } from '@/lib/store';
import { EASE } from '@/lib/khabo';
import '@/styles/home-extra.css';

const BD = '০১২৩৪৫৬৭৮৯';
const toAscii = (s: string) => s.replace(/[০-৯]/g, c => String(BD.indexOf(c)));
/** digits, in English or Bangla */
const DIGITS = '^[0-9০-৯]+$';

function Slot({ char, isActive, hasFakeCaret }: SlotProps) {
  return <div className={clsx('slot', isActive && 'act')}>{char}{hasFakeCaret ? <div className="caret" /> : null}</div>;
}

export function SignIn() {
  const i = useI();
  const signin = useApp(s => s.signin), set = useApp(s => s.set);
  const [step, setStep] = useState<'phone' | 'code'>('phone'), [ph, setPh] = useState(''), [err, setErr] = useState(false), [code, setCode] = useState('');
  const doneRef = useRef(false);
  const [pin, shake] = useAnimate<HTMLSpanElement>();
  const [seen, setSeen] = useState(signin);
  if (seen !== signin) { setSeen(signin); if (signin) { setStep('phone'); setCode(''); setErr(false); } }
  useEffect(() => { if (signin) doneRef.current = false; }, [signin]);

  const digits = toAscii(ph).replace(/\D/g, '').replace(/^(880|0)/, '');
  const ok = /^1[3-9]\d{8}$/.test(digits);
  const nice = `+880 ${digits.slice(0, 4)} ${digits.slice(4)}`.trim();

  const done = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    set({ user: '+880 ' + digits, signin: null });
    toast.success(i.t('signed_in_as', { n: i.dg(nice) }));
    const then = takePending();
    if (then) setTimeout(then, 300);
  };
  const onOpen = (o: boolean) => {
    if (o) return;
    set({ signin: null });
    if (!doneRef.current) takePending(); /* closed without signing in: forget what was waiting */
  };
  const send = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!ok) { setErr(true); if (pin.current) shake(pin.current, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.34 }); return; }
    setStep('code');
  };

  return (
    <Dialog.Root open={!!signin} onOpenChange={onOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dlg-back" />
        <Dialog.Popup className="dlg">
          <AnimatePresence mode="wait" initial={false}>
            {step === 'phone' ? (
              <m.form key="p" className="si-step" onSubmit={send} noValidate
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: EASE }}>
                <Dialog.Title>{i.t('signin_h')}</Dialog.Title>
                <Dialog.Description>{i.t('signin_sub')}</Dialog.Description>
                <label className="si-f">
                  <span>{i.t('phone_no')}</span>
                  <span ref={pin} className={clsx('pin', err && 'bad')}>
                    <span>+880</span>
                    <input value={ph} onChange={ev => { setPh(ev.target.value); setErr(false); }} inputMode="tel" autoComplete="tel-national" placeholder={i.dg('1712 345678')} aria-invalid={err} />
                  </span>
                  <AnimatePresence initial={false}>
                    {err ? <m.span key="e" className="si-err" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>{i.t('phone_err')}</m.span> : null}
                  </AnimatePresence>
                </label>
                <p className="meta">{i.t('signin_fine')}</p>
                <div className="acts-d">
                  <Dialog.Close className="btn btn-line" type="button">{i.t('close')}</Dialog.Close>
                  <m.button className="btn btn-pri" type="submit" whileTap={{ scale: 0.97 }}>{i.t('send_code')}</m.button>
                </div>
              </m.form>
            ) : (
              <m.div key="c" className="si-step"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: EASE }}>
                <Dialog.Title>{i.t('enter_code')}</Dialog.Title>
                <Dialog.Description>{i.t('code_sent', { p: i.dg(nice) })} {i.t('code_demo')}</Dialog.Description>
                <OTPInput maxLength={6} value={code} onChange={setCode} onComplete={() => setTimeout(done, 180)} containerClassName="otp" autoFocus
                  pattern={DIGITS} inputMode="numeric" autoComplete="one-time-code"
                  render={({ slots }) => (
                    <>
                      {slots.slice(0, 3).map((s, k) => <Slot key={k} {...s} />)}
                      <div className="otp-gap" />
                      {slots.slice(3).map((s, k) => <Slot key={k + 3} {...s} />)}
                    </>
                  )} />
                <div className="acts-d">
                  <button className="btn btn-line" type="button" onClick={() => { setCode(''); setStep('phone'); }}>{i.t('back')}</button>
                  <m.button className="btn btn-pri" type="button" disabled={code.length < 6} onClick={done} whileTap={{ scale: 0.97 }}>{i.t('continue')}</m.button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
