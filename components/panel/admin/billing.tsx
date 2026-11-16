'use client';
/* Plans & billing: restaurants are khabo's only paying customers. Monthly plans, paid by bKash or Nagad and
   confirmed by hand for now. Payment states are samples until payments are real.
   Ported from archive/prototype/panel/admin.js (V.billing). */
import clsx from 'clsx';
import { toast } from 'sonner';
import { useI } from '@/components/providers/i18n';
import { where } from '@/lib/khabo';
import type { Plan } from '@/lib/data/types';
import { allR, billOf, fresh, getR, log, setBill, setPlan, type Bill, type PR } from '@/lib/panel/store';
import { BILL_STATUS, PAY_N, PLANS } from '@/lib/panel/words';
import { Ico, MonoR, Page, Sample, usePanel, useT } from '../ui';
import { useDraft, useSaveEntry } from '../draft';

const NONE: Record<string, Plan> = {};

export function Billing() {
  const i = useI(), t = useT(), { db } = usePanel();
  const rows = allR(db).map(r => ({ r, b: billOf(db, r), p: PLANS[r.plan] }));
  const of = (s: Bill['status']) => rows.filter(x => x.b.status === s);
  const sum = (s: Bill['status']) => of(s).reduce((a, x) => a + x.p.price, 0);
  const STATS: [Bill['status'], string, string][] = [
    ['paid', t('Paid this month', 'এই মাসে পরিশোধিত'), 'check-circle'], ['due', t('Due', 'বাকি'), 'clock'],
    ['overdue', t('Overdue', 'মেয়াদ পার'), 'warning'], ['trial', t('On free trial', 'ফ্রি ট্রায়ালে'), 'gift'],
  ];
  /* plan changes are a draft until Save changes: restaurant id to the new plan */
  const pd = useDraft<Record<string, Plan>>(NONE);
  const planOf = (r: PR) => pd.draft[r.id] || r.plan;
  const plan = (r: PR, p: Plan) => pd.set(d => { const n = { ...d }; if (p === r.plan) delete n[r.id]; else n[r.id] = p; return n; });
  const savePlans = () => {
    for (const [id, p] of Object.entries(pd.draft)) { const r = getR(fresh(), id); if (r && r.plan !== p && !setPlan(r, p)) return false; }
    pd.done(NONE);
    return true;
  };
  useSaveEntry({ count: Object.keys(pd.draft).length, save: savePlans, discard: pd.discard });
  const paid = (r: PR, b: Bill) => {
    const price = PLANS[r.plan].price;
    const what = b.status === 'trial'
      ? { en: `Started the paid ${PLANS[r.plan].name.en} plan (৳${price.toLocaleString('en-IN')} a month)`, bn: `${PLANS[r.plan].name.bn} প্ল্যানে টাকা দেওয়া শুরু (মাসে ৳${price.toLocaleString('bn-BD')})` }
      : { en: `Confirmed payment of ৳${price.toLocaleString('en-IN')}`, bn: `৳${price.toLocaleString('bn-BD')} পেমেন্ট নিশ্চিত করেছেন` };
    if (setBill(r.id, { ...b, status: 'paid' }, what)) toast.success(t(`Payment from ${r.name.en} confirmed.`, `${r.name.bn}-এর পেমেন্ট নিশ্চিত হয়েছে।`));
  };
  const remind = (r: PR) => {
    log(r.id, { en: 'Sent a payment reminder', bn: 'পেমেন্টের কথা মনে করিয়ে দিয়েছেন' });
    toast.success(t(`Reminder sent to ${r.name.en} (prototype: nothing is really sent).`, `${r.name.bn}-কে মনে করিয়ে দেওয়া হয়েছে (প্রোটোটাইপ: আসলে কিছু পাঠানো হয়নি)।`));
  };
  return (
    <Page title={t('Plans & billing', 'প্ল্যান ও বিল')} sub={t('Monthly plans. Payments come by bKash or Nagad and are confirmed by hand for now.', 'মাসিক প্ল্যান। টাকা আসে বিকাশ বা নগদে, এখন হাতে নিশ্চিত করা হয়।')} acts={<Sample />}>
      <div className="grid g4">
        {STATS.map(([s, l, ic]) => (
          <div className="card stat" key={s}><div className="k"><Ico n={ic} sm />{l}</div>
            <div className="v num">{s === 'trial' ? i.N(of(s).length) : i.tk(sum(s))}</div>
            <div className="d">{t(`${of(s).length} restaurant${of(s).length === 1 ? '' : 's'}`, `${i.N(of(s).length)}টি রেস্টুরেন্ট`)}</div></div>
        ))}
      </div>
      <div className="card ad-gap">
        <div className="tbl-wrap">
          <table className="tbl tbl-m">
            <thead><tr><th>{t('Restaurant', 'রেস্টুরেন্ট')}</th><th>{t('Plan', 'প্ল্যান')}</th><th className="r">{t('Monthly', 'মাসে')}</th><th>{t('Paid by', 'যেভাবে দেন')}</th><th>{t('Status', 'অবস্থা')}</th><th><span className="sr">{t('Actions', 'কাজ')}</span></th></tr></thead>
            <tbody>
              {rows.map(({ r, b, p }) => (
                <tr key={r.id}>
                  <td className="who-td"><div className="who"><MonoR r={r} /><div><b>{i.L(r.name)}</b><span className="meta">{where(i, r)}</span></div></div></td>
                  <td data-k={t('Plan', 'প্ল্যান')}>
                    <select className="sel sm" style={{ width: 'auto' }} value={planOf(r)} onChange={e => plan(r, e.target.value as Plan)} aria-label={t(`Plan for ${r.name.en}`, `${r.name.bn}-এর প্ল্যান`)}>
                      {(Object.keys(PLANS) as Plan[]).map(k => <option key={k} value={k}>{i.L(PLANS[k].name)}</option>)}
                    </select>
                  </td>
                  <td className="r num" data-k={t('Monthly', 'মাসে')} style={{ fontWeight: 700 }}>{i.tk(PLANS[planOf(r)].price)}{pd.draft[r.id] ? <span className="meta"> ({t('was', 'আগে')} {i.tk(p.price)})</span> : null}</td>
                  <td data-k={t('By', 'মাধ্যম')}>{i.L(PAY_N[b.method] || { en: b.method, bn: b.method })}</td>
                  <td data-k={t('Status', 'অবস্থা')}><span className={clsx('badge', BILL_STATUS[b.status][1])}>{i.L(BILL_STATUS[b.status][0])}</span></td>
                  <td className="r end us-end">
                    {b.status === 'paid' ? <span className="meta">{t('Up to date', 'হালনাগাদ')}</span> : (
                      <span className="us-acts">
                        {b.status !== 'trial' ? <button type="button" className="btn sm ghost" onClick={() => remind(r)}>{t('Send reminder', 'মনে করিয়ে দিন')}</button> : null}
                        <button type="button" className="btn sm" onClick={() => paid(r, b)}>{b.status === 'trial' ? t('Start paid plan', 'টাকা দেওয়া শুরু') : t('Mark as paid', 'পরিশোধিত')}</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="meta" style={{ marginTop: 12 }}>{t('Sample payment states. Prices follow the pricing sheet (Dhaka rates).', 'পেমেন্টের অবস্থা নমুনা। দাম মূল্য তালিকা অনুযায়ী (ঢাকার রেট)।')}</p>
    </Page>
  );
}
