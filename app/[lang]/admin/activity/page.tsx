import { AdminGate } from '@/components/panel/root';
import { Activity } from '@/components/panel/admin/activity';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <AdminGate k="activity"><Activity /></AdminGate>;
}
