import { RestGate } from '@/components/panel/root';
import { Events } from '@/components/panel/rest/events';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <RestGate view="events"><Events /></RestGate>;
}
