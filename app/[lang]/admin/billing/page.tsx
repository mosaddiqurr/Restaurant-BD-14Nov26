import { AdminGate } from '@/components/panel/root';
import { Billing } from '@/components/panel/admin/billing';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <AdminGate k="billing"><Billing /></AdminGate>;
}
