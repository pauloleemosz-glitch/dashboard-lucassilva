import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatBRL, formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  spend: number;
  clicks: number;
}

export function InvestmentClicks({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Investimento diário e cliques" delay={0.1}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--neon-purple))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--neon-cyan) / 0.05)" }}
            content={<NeonTooltip formatValue={(v: number, k: string) => (k === "spend" ? formatBRL(v) : formatNumber(v))} />}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar yAxisId="left" dataKey="spend" name="Investimento" fill="hsl(var(--neon-cyan))" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="clicks" name="Cliques" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
