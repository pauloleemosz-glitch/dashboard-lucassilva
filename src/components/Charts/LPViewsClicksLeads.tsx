import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  lpViews: number;
  clicks: number;
  leads: number;
}

export function LPViewsClicksLeads({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Visualização da Página × Cliques × Leads" delay={0.35}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip content={<NeonTooltip formatValue={(v: number) => formatNumber(v)} />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line type="monotone" dataKey="lpViews" name="Visualizações da Página" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="leads" name="Leads" stroke="hsl(var(--neon-gold))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
