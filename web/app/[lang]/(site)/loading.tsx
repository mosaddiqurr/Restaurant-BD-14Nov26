/* shown for a moment while a page is on its way: grey shapes where the content will be */
export default function Loading() {
  return (
    <div className="wrap sk-page" aria-busy="true" aria-label="Loading">
      <div className="sk sk-line" style={{ width: '42%', height: 40, borderRadius: 12 }} />
      <div className="sk sk-line" style={{ width: '64%' }} />
      <div className="sk-grid" style={{ marginTop: 18 }}>
        {Array.from({ length: 6 }, (_, k) => <div key={k} style={{ display: 'grid', gap: 10 }}><div className="sk sk-card" /><div className="sk sk-line" style={{ width: '70%' }} /><div className="sk sk-line" style={{ width: '45%' }} /></div>)}
      </div>
    </div>
  );
}
