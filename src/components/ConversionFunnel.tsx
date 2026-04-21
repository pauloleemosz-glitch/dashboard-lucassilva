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

export function ConversionFunnel({ cliques, visitas, compras, valorCompra, checkout, leads = 0, showLeads = false }: Props) {
  const max = Math.max(cliques, visitas, compras, leads, 1);
  const stages: Array<{ label: string; value: number; prev: number | null; color: string; display: string; isCurrency?: boolean }> = [
    { label: "Cliques", value: cliques, prev: null, color: "hsl(var(--neon-purple))", display: formatNumber(cliques) },
    { label: "Visitou Site", value: visitas, prev: cliques, color: "hsl(var(--neon-magenta))", display: formatNumber(visitas) },
  ];
  if (showLeads) {
    stages.push({ label: "Leads", value: leads, prev: visitas, color: "hsl(var(--neon-cyan))", display: formatNumber(leads) });
    stages.push({ label: "Compra", value: compras, prev: leads, color: "hsl(var(--neon-orange))", display: formatNumber(compras) });
  } else {
    stages.push({ label: "Compra", value: compras, prev: visitas, color: "hsl(var(--neon-orange))", display: formatNumber(compras) });
  }
  stages.push({ label: "Valor de Compra", value: valorCompra, prev: null, color: "hsl(var(--neon-gold))", display: formatBRL(valorCompra), isCurrency: true });

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });

  return (
    <div ref={ref} className="glass-card rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Funil de Conversão</h3>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Initiate Checkout</div>
          <div className="text-sm neon-text-cyan">{formatBRL(checkout)}</div>
        </div>
      </div>

      <motion.div
        className="space-y-2"
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
        }}
      >
        {stages.map((s, i) => {
          const widthPct = s.isCurrency ? 60 : Math.max(20, ((s.value || 0) / max) * 100);
          const conv = s.prev !== null ? taxaConversao(s.value, s.prev) : null;
          return (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 12, scaleY: 0.6, filter: "blur(6px)" },
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
                  className="rounded-md py-3 px-4 text-center transition-all"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: "60%",
                    background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`,
                    border: `1px solid ${s.color}80`,
                    boxShadow: `0 0 20px ${s.color}30, inset 0 0 20px ${s.color}10`,
                  }}
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
                  <div className="text-lg font-light" style={{ color: s.color, textShadow: `0 0 8px ${s.color}80` }}>
                    {s.display}
                  </div>
                  {conv !== null && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">{formatPct(conv)} da etapa anterior</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {(() => {
          const conv = taxaConversao(checkout, valorCompra);
          if (conv === null) return null;
          return (
            <div className="text-[10px] text-center text-muted-foreground pt-2">
              Compra → Checkout (valor): {formatPct(conv)}
            </div>
          );
        })()}
      </motion.div>
    </div>
  );
}
