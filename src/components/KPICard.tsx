import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | null;
  variation?: number | null;
  icon: LucideIcon;
  color?: "cyan" | "purple" | "orange" | "gold";
  format?: (n: number) => string;
  delay?: number;
}

const colorMap = {
  cyan: "text-neon-cyan",
  purple: "text-neon-purple",
  orange: "text-neon-orange",
  gold: "text-neon-gold",
};
const glowMap = {
  cyan: "hsl(var(--neon-cyan))",
  purple: "hsl(var(--neon-purple))",
  orange: "hsl(var(--neon-orange))",
  gold: "hsl(var(--neon-gold))",
};

export function KPICard({ label, value, variation, icon: Icon, color = "cyan", format, delay = 0 }: Props) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => (format ? format(v) : v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })));

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) return;
    const controls = animate(mv, value, { duration: 1.4, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [value, delay, mv]);

  const variationDisplay = (() => {
    if (variation === null || variation === undefined || !Number.isFinite(variation)) {
      return { icon: Minus, text: "—", cls: "text-muted-foreground" };
    }
    if (variation > 0) return { icon: ArrowUpRight, text: `+${variation.toFixed(1)}%`, cls: "text-neon-cyan" };
    if (variation < 0) return { icon: ArrowDownRight, text: `${variation.toFixed(1)}%`, cls: "text-neon-orange" };
    return { icon: Minus, text: "0%", cls: "text-muted-foreground" };
  })();
  const VIcon = variationDisplay.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-xl p-5 relative overflow-hidden group hover:border-primary/40 transition-colors"
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: glowMap[color] }}
      />
      <div className="flex items-start justify-between mb-3 relative">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", colorMap[color])} style={{ filter: `drop-shadow(0 0 6px ${glowMap[color]})` }} />
      </div>
      {value === null ? (
        <div className="text-3xl text-muted-foreground">—</div>
      ) : (
        <motion.div className={cn("text-3xl font-light tracking-tight", colorMap[color])}>{display}</motion.div>
      )}
      <div className={cn("flex items-center gap-1 mt-2 text-xs", variationDisplay.cls)}>
        <VIcon className="h-3 w-3" />
        <span>{variationDisplay.text}</span>
        <span className="text-muted-foreground ml-1">vs período anterior</span>
      </div>
    </motion.div>
  );
}
