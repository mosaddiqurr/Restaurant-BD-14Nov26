/* while a table menu is on its way: grey shapes where the top, the tabs and the dishes go */
export default function Loading() {
  const line = (w: string, h = 14) => <div className="sk sk-line" style={{ width: w, height: h }} />;
  return (
    <div className="tm tm-th-auto" aria-busy="true" aria-label="Loading" style={{ ['--r-deep' as string]: '#1E2A24', ['--r-accent' as string]: '#F4B91A' }}>
      <header className="tm-h">
        <div className="tm-w" style={{ display: 'grid', gap: 12, paddingTop: 140 }}>
          {line('70%', 36)}{line('50%')}
          <div className="sk" style={{ height: 48, borderRadius: 14, marginTop: 4 }} />
        </div>
      </header>
      <div className="tm-cats"><div className="tm-w" style={{ display: 'flex', gap: 8 }}>{[96, 70, 120, 90].map((w, k) => <div key={k} className="sk" style={{ width: w, height: 34, borderRadius: 99, flex: 'none' }} />)}</div></div>
      <div className="tm-w" style={{ display: 'grid', gap: 18, paddingTop: 22 }}>
        <div className="sk" style={{ height: 52, borderRadius: 12 }} />
        {[0, 1, 2, 3].map(k => (
          <div key={k} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'grid', gap: 8 }}>{line('60%', 16)}{line('40%', 12)}{line('22%', 16)}</div>
            <div className="sk" style={{ width: 84, height: 84, borderRadius: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
