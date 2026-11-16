import '@/styles/table.css';

/* the QR table menu has its own look: no diner header, footer or tab bar, just the restaurant's menu */
export default function TableLayout({ children }: LayoutProps<'/[lang]/t'>) {
  return <>{children}</>;
}
