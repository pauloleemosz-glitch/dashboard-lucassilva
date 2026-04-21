import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  reach: number;
  frequency: number;
}

export function ReachFrequency({ data }: { data: Point[] }) {
  return (
    <ChartCard title="Alcance e Frequência" delay={0.2}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="hsl(var(--neon-magenta))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--neon-orange))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--neon-cyan) / 0.05)" }}
            content={<NeonTooltip formatValue={(v: number, k: string) => (k === "frequency" ? v.toFixed(2) : formatNumber(v))} />}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar yAxisId="left" dataKey="reach" name="Alcance" fill="hsl(var(--neon-magenta))" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="frequency" name="Frequência" fill="hsl(var(--neon-orange))" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
