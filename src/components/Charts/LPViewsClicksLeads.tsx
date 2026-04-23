import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "./ChartCard";
import { formatNumber, formatPct } from "@/utils/parsers";

interface Point {
  date: string;
  lpViews: number;
  clicks: number;
  leads: number;
}

function LPTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value ?? 0;
  const lpViews = get("lpViews");
  const clicks = get("clicks");
  const leads = get("leads");
  const convClickToLP = clicks > 0 ? (lpViews / clicks) * 100 : null;
  const convLPToLead = lpViews > 0 ? (leads / lpViews) * 100 : null;
  const convClickToLead = clicks > 0 ? (leads / clicks) * 100 : null;

  return (
    <div
      className="rounded-md px-3 py-2 text-xs"
      style={{
        background: "hsl(220 60% 6% / 0.95)",
        border: "1px solid hsl(var(--neon-cyan) / 0.5)",
        boxShadow: "0 0 16px hsl(var(--neon-cyan) / 0.3)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="text-foreground tabular-nums">{formatNumber(p.value)}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-primary/20 space-y-0.5">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          Taxas de conversão
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Clique → Página:</span>
          <span className="text-neon-cyan tabular-nums">{convClickToLP === null ? "—" : formatPct(convClickToLP)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Página → Lead:</span>
          <span className="text-neon-gold tabular-nums">{convLPToLead === null ? "—" : formatPct(convLPToLead)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Clique → Lead:</span>
          <span className="text-neon-magenta tabular-nums">{convClickToLead === null ? "—" : formatPct(convClickToLead)}</span>
        </div>
      </div>
    </div>
  );
}

export function LPViewsClicksLeads({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Visualização da Página × Cliques × Leads" delay={0.35}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<LPTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line type="monotone" dataKey="lpViews" name="Visualizações da Página" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--neon-gold))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
