import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatBRL, formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  spend: number;
  clicks: number;
  conversions: number;
}

export function GoogleInvestmentConversions({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Google Ads · Investimento × Cliques × Conversões" delay={0.05}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--neon-orange))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            content={<NeonTooltip formatValue={(v: number, k: string) => (k === "spend" ? formatBRL(v) : formatNumber(v))} />}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="spend" name="Investimento" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversões" stroke="hsl(var(--neon-orange))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
