import { AdminGate } from '@/components/panel/root';
import { SiteText } from '@/components/panel/admin/content';

/* the panel draws once the browser knows who is signed in (demo session), so this page cannot be prerendered */
export const instant = false;

export default function Page() {
  return <AdminGate k="content"><SiteText /></AdminGate>;
}
