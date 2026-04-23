import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";
import { taxaConversao } from "@/utils/metrics";

interface Props {
  cliques: number;
  visitas: number;
  compras: number;
  valorCompra: number;
  checkout: number;
  leads?: number;
  showLeads?: boolean;
}

interface Stage {
  label: string;
  value: number;
  prev: number | null;
  color: string;
  display: string;
  isCurrency?: boolean;
}

export function ConversionFunnel({
  cliques,
  visitas,
  compras,
  valorCompra,
  checkout,
  leads = 0,
  showLeads = false,
}: Props) {
  const stages: Stage[] = [
    { label: "Cliques", value: cliques, prev: null, color: "hsl(var(--neon-purple))", display: formatNumber(cliques) },
    { label: "Visitou Site", value: visitas, prev: cliques, color: "hsl(var(--neon-magenta))", display: formatNumber(visitas) },
  ];
  if (showLeads) {
    stages.push({ label: "Leads", value: leads, prev: visitas, color: "hsl(var(--neon-cyan))", display: formatNumber(leads) });
    stages.push({ label: "Initiate Checkout", value: checkout, prev: leads, color: "hsl(var(--neon-gold))", display: formatBRL(checkout), isCurrency: true });
    stages.push({ label: "Compra", value: compras, prev: leads, color: "hsl(var(--neon-orange))", display: formatNumber(compras) });
  } else {
    stages.push({ label: "Initiate Checkout", value: checkout, prev: visitas, color: "hsl(var(--neon-gold))", display: formatBRL(checkout), isCurrency: true });
    stages.push({ label: "Compra", value: compras, prev: visitas, color: "hsl(var(--neon-orange))", display: formatNumber(compras) });
  }
  stages.push({
    label: "Valor de Compra",
    value: valorCompra,
    prev: null,
    color: "hsl(var(--neon-gold))",
    display: formatBRL(valorCompra),
    isCurrency: true,
  });

  // Trapezoid widths: linear taper from 100% to 45%
  const total = stages.length;
  const minW = 45;
  const maxW = 100;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });

  return (
    <div ref={ref} className="glass-card rounded-xl p-5 h-full relative overflow-hidden">
      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--neon-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neon-cyan)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="flex items-center justify-between mb-5 relative">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Funil de Conversão</h3>
        <div className="text-[10px] uppercase tracking-widest text-neon-cyan/80">
          {total} etapas
        </div>
      </div>

      <motion.div
        className="space-y-1.5 relative"
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
        }}
      >
        {stages.map((s, i) => {
          const widthPct = maxW - ((maxW - minW) * i) / Math.max(1, total - 1);
          const conv = s.prev !== null ? taxaConversao(s.value, s.prev) : null;
          const isLast = i === stages.length - 1;
          return (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 14, scaleY: 0.5, filter: "blur(8px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  scaleY: 1,
                  filter: "blur(0px)",
                  transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              style={{ transformOrigin: "top" }}
              className="relative"
            >
              <div className="flex justify-center">
                <div
                  className="relative py-3 px-4 text-center transition-all group"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: "44%",
                    clipPath: isLast
                      ? "polygon(8% 0, 92% 0, 100% 100%, 0% 100%)"
                      : "polygon(6% 0, 94% 0, 96% 100%, 4% 100%)",
                    background: `linear-gradient(180deg, ${s.color}40, ${s.color}10)`,
                    boxShadow: `0 0 24px ${s.color}40, inset 0 1px 0 ${s.color}80, inset 0 -1px 0 ${s.color}30`,
                  }}
                >
                  {/* Top neon edge */}
                  <div
                    className="absolute top-0 left-[6%] right-[6%] h-px"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  />
                  <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
                  <div
                    className="text-lg font-light tabular-nums"
                    style={{ color: s.color, textShadow: `0 0 10px ${s.color}` }}
                  >
                    {s.display}
                  </div>
                  {conv !== null && (
                    <div className="text-[9px] text-muted-foreground/80 mt-0.5 tracking-wider">
                      <span className="text-neon-cyan/90">{formatPct(conv)}</span> da etapa anterior
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex justify-center -my-0.5 relative z-10">
                  <div
                    className="w-px h-2"
                    style={{
                      background: `linear-gradient(180deg, ${s.color}, ${stages[i + 1].color})`,
                      boxShadow: `0 0 6px ${s.color}80`,
                    }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
