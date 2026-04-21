import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  delay?: number;
  children: ReactNode;
}

export function ChartCard({ title, delay = 0, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className="glass-card rounded-xl p-5"
    >
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">{title}</h3>
      <div className="h-[280px] w-full">{children}</div>
    </motion.div>
  );
}

export function NeonTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload || !payload.length) return null;
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
          <span className="text-foreground">{formatValue ? formatValue(p.value, p.dataKey) : p.value?.toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
}
