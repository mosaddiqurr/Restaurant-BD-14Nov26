/* while one restaurant's panel page opens: soft grey shapes where the page will be */
export default function Loading() {
  return (
    <div style={{ padding: '28px 24px', display: 'grid', gap: 16, maxWidth: 1100 }} aria-busy="true">
      <div className="sk sk-line" style={{ width: '38%', height: 30, borderRadius: 10 }} />
      <div className="sk sk-line" style={{ width: '60%' }} />
      <div className="sk" style={{ height: 220 }} />
      <div className="sk" style={{ height: 140 }} />
    </div>
  );
}
