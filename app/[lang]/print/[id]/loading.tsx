/* while the menu paper is on its way: a blank sheet */
export default function Loading() {
  return (
    <div className="pmw" aria-busy="true" aria-label="Loading">
      <div className="pmw-stage"><div className="sk" style={{ width: 'min(793px, 100%)', aspectRatio: '210 / 297', borderRadius: 2 }} /></div>
    </div>
  );
}
