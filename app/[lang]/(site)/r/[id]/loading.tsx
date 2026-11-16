import '@/styles/restaurant-extra.css';
/* while a restaurant page is on its way: grey shapes where the film, the facts, the section bar and the menu go */
export default function Loading() {
  const line = (w: string, h = 14) => <div className="sk sk-line" style={{ width: w, height: h }} />;
  return (
    <div className="rp sk-rp" aria-busy="true" aria-label="Loading">
      <div className="wrap">
        <div className="sk sk-cover">
          <div className="sk-plaq" />
        </div>
        <div className="under">
          <div className="facts sk-facts">
            {[0, 1, 2, 3].map(k => <div key={k} className="sk-fact">{line('70px', 22)}{line('90px', 12)}</div>)}
          </div>
          <div className="racts">
            <div className="sk" style={{ height: 80, borderRadius: 18 }} />
            <div className="racts-2">{[0, 1, 2].map(k => <div key={k} className="sk" style={{ height: 44, borderRadius: 12 }} />)}</div>
          </div>
        </div>
      </div>
      <div className="sk-nav"><div className="wrap">{[48, 56, 60, 52, 62, 40].map((w, k) => <div key={k} className="sk sk-line" style={{ width: w }} />)}</div></div>
      <div className="wrap sk-intro">
        <div style={{ display: 'grid', gap: 12 }}>{line('56%', 30)}{line('92%')}{line('86%')}{line('64%')}</div>
        <div className="sk-info">{[0, 1, 2, 3, 4, 5].map(k => <div key={k}>{line('40%', 11)}{line('70%')}</div>)}</div>
      </div>
    </div>
  );
}
