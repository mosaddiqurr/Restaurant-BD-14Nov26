/* Grey shapes shown while a page is on its way (loading.tsx) or while the browser reads the filters from the
   address (the Suspense fallback). They use the same layout classes as the real pages, so nothing jumps. */
import type { CSSProperties } from 'react';

const Line = ({ w, h, r, style }: { w: string | number; h?: number; r?: number; style?: CSSProperties }) =>
  <div className="sk sk-line" style={{ width: w, ...(h ? { height: h } : {}), ...(r != null ? { borderRadius: r } : {}), ...style }} />;
const Box = ({ h, r = 20, style }: { h: number | string; r?: number; style?: CSSProperties }) => <div className="sk" style={{ height: h, borderRadius: r, ...style }} />;
const Card = () => (
  <div style={{ display: 'grid', gap: 10 }}>
    <div className="sk sk-card" style={{ aspectRatio: '4 / 3', borderRadius: 18 }} />
    <Line w="72%" />
    <Line w="46%" h={12} />
  </div>
);
const Head = ({ right }: { right?: React.ReactNode }) => (
  <div className="lh" aria-hidden="true">
    <div style={{ display: 'grid', gap: 14, flex: '1 1 320px' }}>
      <Line w="min(420px, 70%)" h={52} r={14} />
      <Line w="min(520px, 92%)" />
    </div>
    {right}
  </div>
);

export function ListSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <Head right={<div className="sk" style={{ height: 48, borderRadius: 99, width: 340, maxWidth: '100%' }} />} />
      <div className="ls">
        <aside className="side-f sk-sidef" aria-hidden="true">
          <Line w="40%" /><Box h={40} r={12} />
          {Array.from({ length: 7 }, (_, k) => <Line key={k} w={`${60 + (k * 13) % 30}%`} />)}
          <Line w="50%" style={{ marginTop: 18 }} />
          {Array.from({ length: 4 }, (_, k) => <Line key={'b' + k} w={`${50 + (k * 17) % 30}%`} />)}
        </aside>
        <div style={{ minWidth: 0 }}>
          <div className="lbar"><Line w={110} h={40} r={11} /><Line w={80} /><span className="sp" /><Line w={130} h={40} r={11} /></div>
          <div className="grid3">{Array.from({ length: 6 }, (_, k) => <Card key={k} />)}</div>
        </div>
      </div>
    </div>
  );
}

export function DishesSkeleton() {
  return (
    <div aria-busy="true">
      <div className="dh"><div className="wrap"><div style={{ display: 'grid', gap: 14 }}><Line w="min(360px, 70%)" h={52} r={14} /><Line w="min(520px, 92%)" /></div></div></div>
      <div className="tb"><div className="wrap">
        <div className="crail" aria-hidden="true">
          {Array.from({ length: 12 }, (_, k) => <div key={k} className="cr" style={{ pointerEvents: 'none' }}><div className="sk" style={{ width: 46, height: 46, borderRadius: '50%' }} /><Line w={52} h={10} /></div>)}
        </div>
        <div className="tb-row">
          <div className="sk" style={{ height: 40, borderRadius: 11, flex: '1 1 240px', maxWidth: 260 }} />
          {[120, 110, 70, 90, 100].map((w, k) => <Line key={k} w={w} h={40} r={11} />)}
        </div>
      </div></div>
      <div className="wrap">
        {[0, 1].map(g => (
          <div key={g} className="dgroup">
            <Line w={180} h={24} r={8} />
            <div className="dgrid" style={{ marginTop: 18 }}>{Array.from({ length: 4 }, (_, k) => <Card key={k} />)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DealsSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <Head />
      <Box h="min(444px, 600px)" r={26} style={{ marginTop: 28 }} />
      <div className="sec" style={{ paddingTop: 72 }}>
        <div className="sec-head"><Line w={220} h={36} r={10} /><Line w={220} h={40} r={12} /></div>
        <div className="deal-grid">{Array.from({ length: 4 }, (_, k) => <Box key={k} h={240} r={22} />)}</div>
      </div>
    </div>
  );
}

export function PricesSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <Head right={<Line w={260} h={40} r={12} />} />
      <div style={{ marginTop: 26, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}><div className="sk" style={{ flex: 1, height: 40, borderRadius: 11 }} /><Line w={130} h={40} r={11} /></div>
        <div style={{ display: 'flex', gap: 6, overflow: 'hidden' }}>{Array.from({ length: 10 }, (_, k) => <Line key={k} w={70 + (k * 23) % 40} h={32} r={10} style={{ flex: 'none' }} />)}</div>
        <PriceCardSkeleton />
      </div>
    </div>
  );
}
/** the chart card while the numbers are worked out */
export function PriceCardSkeleton() {
  return (
    <div className="card pt-card" aria-busy="true">
      <div className="card-h"><Line w="min(360px, 60%)" h={20} /><Line w={120} h={12} /></div>
      <div className="pt-chart"><Box h="100%" r={14} /></div>
      <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>{Array.from({ length: 4 }, (_, k) => <Line key={k} w={`${92 - k * 7}%`} h={18} />)}</div>
    </div>
  );
}

export function EventsSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <Head />
      <div className="ev-tools"><Line w={480} h={40} r={12} style={{ maxWidth: '100%' }} /><Line w={130} h={40} r={11} /></div>
      <div className="chips" style={{ marginTop: 12 }}>{Array.from({ length: 6 }, (_, k) => <Line key={k} w={90 + (k * 19) % 40} h={32} r={10} />)}</div>
      <EventGridSkeleton />
    </div>
  );
}
export function EventGridSkeleton() {
  return <div className="ev-g" style={{ marginTop: 24 }} aria-busy="true">{Array.from({ length: 3 }, (_, k) => <Box key={k} h={380} r={22} />)}</div>;
}

export function BizSkeleton() {
  return (
    <div className="wrap" aria-busy="true">
      <section className="bz-hero">
        <div style={{ display: 'grid', gap: 16 }}>
          <Line w="90%" h={64} r={16} /><Line w="70%" h={64} r={16} />
          <Line w="95%" /><Line w="80%" />
          <div className="bz-btns"><Line w={180} h={52} r={12} /><Line w={170} h={52} r={12} /></div>
        </div>
        <div className="sk" style={{ width: 300, height: 620, borderRadius: 48, margin: '0 auto', maxWidth: '100%' }} />
      </section>
    </div>
  );
}
