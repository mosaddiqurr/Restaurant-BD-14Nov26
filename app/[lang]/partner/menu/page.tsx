import { RestGate } from '@/components/panel/root';
import { MenuPage } from '@/components/panel/rest/menu';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <RestGate view="menu"><MenuPage /></RestGate>;
}
