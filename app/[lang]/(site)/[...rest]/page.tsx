import { notFound } from 'next/navigation';

/* any address we do not know shows the friendly "not found" page (worked out when it is asked for) */
export const instant = false;

export default function Unknown() {
  notFound();
}
