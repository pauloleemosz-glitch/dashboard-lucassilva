import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard, NeonTooltip } from "./ChartCard";
import { formatBRL, formatNumber } from "@/utils/parsers";

interface Point {
  date: string;
  spend: number;
  leads: number;
  cpl: number | null;
}

/** titulo/rotulo/rotuloCusto trocam o texto quando a série carrega outra coisa que não lead (ex.: conversas iniciadas). */
export function LeadsSpendCPA({ data, titulo = "Captação de Leads no período · Leads × Gasto × CPA", rotulo = "Leads", rotuloCusto = "CPA (Lead)" }:
  { data: Point[]; titulo?: string; rotulo?: string; rotuloCusto?: string }) {
  return (
    <ChartCard title={titulo} delay={0.3}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--neon-orange))" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            content={<NeonTooltip formatValue={(v: number, k: string) => (k === "leads" ? formatNumber(v) : formatBRL(v))} />}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="left" type="monotone" dataKey="spend" name="Gasto" stroke="hsl(var(--neon-cyan))" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="leads" name={rotulo} stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="cpl" name={rotuloCusto} stroke="hsl(var(--neon-orange))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
