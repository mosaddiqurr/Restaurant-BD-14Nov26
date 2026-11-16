import { RestGate } from '@/components/panel/root';
import { Photos } from '@/components/panel/rest/photos';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <RestGate view="photos"><Photos /></RestGate>;
}
