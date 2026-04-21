import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatBRL, formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  spend: number;
  purchases: number;
  cpa: number | null;
}

export function SpendPurchasesCPA({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Gastos, Compras e CPA ao longo do tempo" delay={0.3}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--neon-orange))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            content={<NeonTooltip formatValue={(v: number, k: string) => (k === "purchases" ? formatNumber(v) : formatBRL(v))} />}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="spend" name="Gastos" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="purchases" name="Compras" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="cpa" name="CPA" stroke="hsl(var(--neon-orange))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
