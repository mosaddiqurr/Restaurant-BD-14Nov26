import { AdminGate } from '@/components/panel/root';
import { Leads } from '@/components/panel/admin/leads';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <AdminGate k="leads"><Leads /></AdminGate>;
}
