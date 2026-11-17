import '@/styles/restaurant-extra.css';
/* while the reviews page is on its way: the summary box and a few review cards in grey */
export default function Loading() {
  const line = (w: string, h = 14) => <div className="sk sk-line" style={{ width: w, height: h }} />;
  return (
    <div className="wrap lp rvp" aria-busy="true" aria-label="Loading">
      {line('140px')}
      <div style={{ display: 'grid', gap: 10, margin: '22px 0' }}>{line('50%', 40)}{line('30%')}</div>
      <div className="rvs rvp-body">
        <div className="sk" style={{ height: 360, borderRadius: 20 }} />
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          {line('70%', 40)}
          {[0, 1, 2].map(k => <div key={k} className="sk" style={{ height: 150, borderRadius: 18 }} />)}
        </div>
      </div>
    </div>
  );
}
