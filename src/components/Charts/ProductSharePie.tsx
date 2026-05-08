import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartCard } from "./ChartCard";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";

interface Slice {
  name: string;
  value: number;
  revenue?: number;
}

const COLORS = [
  "hsl(var(--neon-cyan))",
  "hsl(var(--neon-purple))",
  "hsl(var(--neon-magenta))",
  "hsl(var(--neon-orange))",
  "hsl(var(--neon-gold))",
  "hsl(var(--neon-green, var(--neon-cyan)))",
];

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const pct = total > 0 ? (p.value / total) * 100 : 0;
  return (
    <div
      className="rounded-md px-3 py-2 text-xs"
      style={{
        background: "hsl(220 60% 6% / 0.95)",
        border: `1px solid ${p.payload.fill}80`,
        boxShadow: `0 0 16px ${p.payload.fill}40`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ background: p.payload.fill }} />
        <span style={{ color: p.payload.fill }}>{p.name}</span>
      </div>
      <div className="text-foreground tabular-nums">{formatNumber(p.value)} vendas</div>
      {typeof p.payload.revenue === "number" && p.payload.revenue > 0 && (
        <div className="text-foreground tabular-nums">{formatBRL(p.payload.revenue)}</div>
      )}
      <div className="text-muted-foreground">{formatPct(pct)} do total</div>
    </div>
  );
}

export function ProductSharePie({
  title,
  data,
  delay = 0,
}: {
  title: string;
  data: Slice[];
  delay?: number;
}) {
  const filtered = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = filtered.reduce((acc, d) => acc + d.value, 0);

  return (
    <ChartCard title={title} delay={delay}>
      {filtered.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Sem dados no período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="hsl(220 60% 6%)"
              strokeWidth={2}
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip total={total} />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              formatter={(v: string, entry: any) => {
                const rev = entry?.payload?.revenue;
                return (
                  <span style={{ color: "hsl(var(--muted-foreground))" }}>
                    {v}
                    {typeof rev === "number" && rev > 0 && (
                      <span className="ml-1 text-foreground tabular-nums">· {formatBRL(rev)}</span>
                    )}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
