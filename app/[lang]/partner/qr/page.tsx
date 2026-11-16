import { RestGate } from '@/components/panel/root';
import { TableQr } from '@/components/panel/rest/qr';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <RestGate view="qr"><TableQr /></RestGate>;
}
