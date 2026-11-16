'use client';
/* "Ask the khabo team": the one way an owner asks for something only the team can change (name, area, web address...).
   It goes to the team's Requests inbox; the answer comes back on Overview and Team & account. */
import { useState } from 'react';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { fresh, request, requestsOf } from '@/lib/panel/store';
import { REQ, type ReqKind } from '@/lib/panel/words';
import { AreaF, Ico, Modal, SelF, TextF, useR, useT } from './ui';

export function AskKhabo({ open, kind = 'name', onClose }: { open: boolean; kind?: ReqKind; onClose: () => void }) {
  const i = useI(), t = useT(), { r } = useR();
  const [f, setF] = useState({ kind: kind as string, en: '', bn: '', text: '', note: '' });
  const [was, setWas] = useState(false);
  if (open && !was) { setWas(true); setF({ kind, en: '', bn: '', text: '', note: '' }); }
  if (!open && was) setWas(false);
  const up = (k: keyof typeof f) => (v: string) => setF(o => ({ ...o, [k]: v }));
  const send = () => {
    const k = f.kind as ReqKind;
    if (requestsOf(fresh(), r.id).some(q => q.state === 'open' && q.kind === k)) return toast.error(t(`You already asked about the ${REQ[k].en.toLowerCase()}. Cancel that one first under Team & account.`, `${REQ[k].bn} নিয়ে আগেই বলেছেন। আগে টিম ও অ্যাকাউন্টে সেটা বাতিল করুন।`));
    if (k === 'name' && (!f.en.trim() || f.en.trim() === r.name.en)) return toast.error(t('Write the new English name.', 'নতুন ইংরেজি নাম লিখুন।'));
    if (k !== 'name' && f.text.trim().length < 4) return toast.error(t('Write what should change.', 'কী বদলাতে হবে, লিখুন।'));
    if (!request(r.id, k, k === 'name' ? { en: f.en.trim(), bn: f.bn.trim() } : { text: f.text.trim() }, f.note.trim() || undefined)) return;
    onClose(); toast.success(t('Sent. The khabo team has been told and will answer here.', 'পাঠানো হয়েছে। খাবো টিমকে জানানো হয়েছে, উত্তর এখানেই পাবেন।'));
  };
  return (
    <Modal open={open} onClose={onClose} title={t('Ask the khabo team', 'খাবো টিমকে বলুন')}
      foot={<><button className="btn ghost l" onClick={onClose}>{t('Cancel', 'বাতিল')}</button><button className="btn pri" onClick={send}><Ico n="paper-plane-right" sm />{t('Send to khabo', 'খাবোকে পাঠান')}</button></>}>
      <p className="meta">{t('Some things only the khabo team changes, so diners, reviews and printed QR codes never lose track of you. We usually answer within a day.', 'কিছু জিনিস শুধু খাবো টিম বদলায়, যাতে ডাইনার, রিভিউ আর ছাপানো কিউআর কোড কখনো আপনাকে হারিয়ে না ফেলে। আমরা সাধারণত এক দিনের মধ্যে উত্তর দিই।')}</p>
      <div className="f-grid">
        <SelF full label={t('What do you want to change?', 'কী বদলাতে চান?')} value={f.kind} onChange={up('kind')} opts={(Object.keys(REQ) as ReqKind[]).map(k => [k, i.L(REQ[k])])} />
        {f.kind === 'name' ? <>
          <TextF full label={t('New name (English)', 'নতুন নাম (ইংরেজি)')} value={f.en} onChange={up('en')} />
          <TextF full bn label={t('New name (Bangla)', 'নতুন নাম (বাংলা)')} value={f.bn} onChange={up('bn')} />
        </> : <AreaF full label={t('What should it be?', 'কী হওয়া উচিত?')} value={f.text} onChange={up('text')} rows={3} ph={t('e.g. We moved to House 12, Road 27, Dhanmondi. The map pin should move too.', 'যেমন আমরা বাড়ি ১২, রোড ২৭, ধানমন্ডিতে সরে গেছি। ম্যাপের পিনও সরাতে হবে।')} />}
        <AreaF full label={t('Anything else? (optional)', 'আর কিছু? (ঐচ্ছিক)')} value={f.note} onChange={up('note')} rows={2} ph={t('e.g. We rebranded in December', 'যেমন ডিসেম্বরে আমরা নতুন নাম নিয়েছি')} />
      </div>
    </Modal>
  );
}
