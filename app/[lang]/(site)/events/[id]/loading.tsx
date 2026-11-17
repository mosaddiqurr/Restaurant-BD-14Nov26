import '@/styles/pages-extra.css';
/* while one event's page is on its way: grey shapes where the photo, the title, the details and the buttons go.
   It also lets the page open at once on a tap (Next.js shows this, then streams the event in) */
export default function Loading() {
  const line = (w: string, h = 14) => <div className="sk sk-line" style={{ width: w, height: h }} />;
  return (
    <div className="wrap lp evp" aria-busy="true" aria-label="Loading">
      {line('90px', 14)}
      <div className="evp-top" style={{ marginTop: 18 }}>
        <div className="sk" style={{ aspectRatio: '4 / 3', borderRadius: 24 }} />
        <div className="evp-info">
          {line('110px', 30)}{line('90%', 40)}{line('60%', 40)}{line('120px', 16)}
          <div style={{ display: 'grid', gap: 14, marginTop: 8 }}>{[0, 1, 2].map(k => <div key={k}>{line('70%', 18)}</div>)}</div>
          <div className="evp-act">{[150, 120, 100].map(w => <div key={w} className="sk" style={{ width: w, height: 46, borderRadius: 14 }} />)}</div>
        </div>
      </div>
    </div>
  );
}
