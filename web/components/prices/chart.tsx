'use client';
/* One calm line: the typical menu price of a dish in an area, week by week (Recharts).
   Loaded only on the price page, after the page has drawn (next/dynamic). Never one restaurant's line. */
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI } from '@/components/providers/i18n';
import { useMedia } from '@/components/ui/bits';

export type TrendRow = { t: string; v: number };

type TipItem = { value?: number | string | null };
function Tip({ active, payload, label, name }: { active?: boolean; payload?: TipItem[]; label?: string | number; name: string }) {
  const i = useI();
  const v = payload?.[0]?.value;
  if (!active || v == null) return null;
  return <div className="tt"><b>{i.tk(Number(v))}</b>{label} · {name}</div>;
}

export default function TrendChart({ data, name }: { data: TrendRow[]; name: string }) {
  const i = useI();
  const calm = useMedia('(prefers-reduced-motion: reduce)');
  const narrow = useMedia('(max-width: 600px)');
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="t" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} interval={narrow ? 8 : 4} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} width={narrow ? 46 : 54} tickFormatter={v => '৳' + i.N(Number(v))}
          domain={[(lo: number) => Math.floor(lo * 0.9 / 10) * 10, (hi: number) => Math.ceil(hi * 1.06 / 10) * 10]} tickCount={4} />
        <Tooltip content={p => <Tip active={p.active} payload={p.payload as unknown as TipItem[]} label={p.label as string} name={name} />} cursor={{ stroke: 'var(--line-2)', strokeWidth: 1.5 }} isAnimationActive={false} />
        <Area type="stepAfter" dataKey="v" stroke="var(--hl)" strokeWidth={2.5} fill="var(--hl)" fillOpacity={0.08} dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: 'var(--hl)' }} isAnimationActive={!calm} animationDuration={300} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
