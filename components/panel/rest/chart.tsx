'use client';
/* Page views per day (Recharts). Loaded only when the Overview opens (next/dynamic), so other pages stay light. */
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Row = { d: string; v: number };
export default function ViewsChart({ data, unit }: { data: Row[]; unit: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} interval={6} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 12 }} width={44} />
        <Tooltip cursor={{ stroke: 'var(--line-2)' }} content={({ active, payload, label }) => active && payload && payload.length
          ? <div className="tt"><b>{unit(Number(payload[0].value))}</b>{label}</div> : null} />
        <Area type="monotone" dataKey="v" stroke="var(--indigo)" strokeWidth={2.4} fill="var(--indigo)" fillOpacity={0.12} activeDot={{ r: 5 }} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
