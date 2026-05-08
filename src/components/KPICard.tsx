import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
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
  const reduced = useReducedMotion();

  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    format ? format(v) : v.toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
  );

  // Counter runs on mount/value changes; avoids invisible cards when viewport observers lag in preview.
  useEffect(() => {
    if (value === null || !Number.isFinite(value)) return;
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.4, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [value, delay, mv, reduced]);

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
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-xl p-3 sm:p-5 relative overflow-hidden group hover:border-primary/40 transition-colors min-w-0"
    >
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: glowMap[color] }}
      />
      <div className="flex items-start justify-between mb-2 sm:mb-3 relative gap-2 min-w-0">
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground truncate">{label}</span>
        <Icon className={cn("h-4 w-4 shrink-0", colorMap[color])} style={{ filter: `drop-shadow(0 0 6px ${glowMap[color]})` }} />
      </div>
      {value === null ? (
        <div className="text-xl sm:text-3xl text-muted-foreground">—</div>
      ) : (
        <motion.div
          className={cn(
            "font-light tracking-tight leading-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis",
            "text-[clamp(0.85rem,4.2vw,1.875rem)] sm:text-3xl",
            colorMap[color],
          )}
          title={typeof value === "number" ? value.toString() : undefined}
        >
          {display}
        </motion.div>
      )}
      <div className={cn("flex items-center gap-1 mt-2 text-[10px] sm:text-xs flex-wrap", variationDisplay.cls)}>
        <VIcon className="h-3 w-3 shrink-0" />
        <span>{variationDisplay.text}</span>
        <span className="text-muted-foreground ml-1 truncate">vs período anterior</span>
      </div>
    </motion.div>
  );
}
