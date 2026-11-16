import { RestGate } from '@/components/panel/root';
import { Team } from '@/components/panel/rest/team';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <RestGate view="team"><Team /></RestGate>;
}
