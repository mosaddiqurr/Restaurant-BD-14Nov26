/* What /prices shows while it loads: the same shape as the page (tools, dish chips, the summary card and the list). */
import '@/styles/prices.css';

export function PricesSkeleton() {
  return (
    <div className="wrap lp px" aria-busy="true">
      <div className="lh">
        <div style={{ display: 'grid', gap: 12, width: 'min(520px, 100%)' }}>
          <div className="sk" style={{ height: 48, width: '80%' }} />
          <div className="sk" style={{ height: 16, width: '95%' }} />
        </div>
        <div className="sk" style={{ height: 40, width: 260, maxWidth: '100%', borderRadius: 12 }} />
      </div>
      <div className="px-body">
        <div className="px-tools">
          <div className="px-q"><div className="sk" style={{ flex: '1 1 260px', height: 40, borderRadius: 11 }} /><div className="sk" style={{ width: 130, height: 40, borderRadius: 11 }} /></div>
          <div className="px-types" style={{ overflow: 'hidden' }}>{Array.from({ length: 8 }, (_, k) => <div key={k} className="sk" style={{ flex: 'none', width: 136, height: 56, borderRadius: 14 }} />)}</div>
        </div>
        <div className="px-grid">
          <div className="sk" style={{ gridArea: 'sum', height: 300, borderRadius: 22 }} />
          <div className="px-list">{Array.from({ length: 5 }, (_, k) => <div key={k} className="sk" style={{ height: 92, borderRadius: 16 }} />)}</div>
        </div>
      </div>
    </div>
  );
}
