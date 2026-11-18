'use client';
/* Requests: changes restaurants asked for that only the khabo team can make (a new name, a new area,
   a 360 shoot...). New ones pop up in every open team tab. Ported from archive/prototype/panel/admin.js (V.requests). */
import { useI } from '@/components/providers/i18n';
import { getR, openRequests, requestsOf } from '@/lib/panel/store';
import { Empty, Page, usePanel, useT } from '../ui';
import { ReqRows } from './parts';

export function Requests() {
  const i = useI(), t = useT(), { db } = usePanel();
  const open = openRequests(db);
  const past = requestsOf(db).filter(q => q.state !== 'open' && !!getR(db, q.rid)).slice(0, 40);
  return (
    <Page title={t('Requests', 'অনুরোধ')} sub={t('Changes restaurants asked for that only the Khaoya team can make. New ones pop up in every open admin tab.', 'রেস্টুরেন্ট যে বদল চেয়েছে, যা শুধু খাওয়া টিম করতে পারে। নতুন অনুরোধ খোলা প্রতিটি অ্যাডমিন ট্যাবে ভেসে ওঠে।')}>
      <div className="card">
        <div className="card-h"><h2>{t('Waiting', 'অপেক্ষায়')}</h2>{open.length ? <span className="badge gold">{i.N(open.length)}</span> : null}</div>
        <div className="rows" style={{ padding: '4px 0' }}>
          {open.length ? <ReqRows list={open} act /> : <Empty icon="check-circle" title={t('Nothing waiting', 'কিছু অপেক্ষায় নেই')}>{t('When a restaurant asks for a change, it shows here.', 'কোনো রেস্টুরেন্ট বদল চাইলে এখানে দেখাবে।')}</Empty>}
        </div>
      </div>
      {past.length ? (
        <div className="card ad-gap">
          <div className="card-h"><h2>{t('Answered', 'উত্তর দেওয়া')}</h2></div>
          <div className="rows" style={{ padding: '4px 0' }}><ReqRows list={past} /></div>
        </div>
      ) : null}
    </Page>
  );
}
