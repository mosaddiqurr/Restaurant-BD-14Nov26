import { AdminGate } from '@/components/panel/root';
import { AdminOverview } from '@/components/panel/admin/overview';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <AdminGate k=""><AdminOverview /></AdminGate>;
}
