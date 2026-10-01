import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { formatNumber, formatPct } from "@/utils/parsers";

interface Props {
  visitas: number;
  scroll25: number;
  scroll50: number;
  scroll75: number;
  scroll90: number;
  viuBotao: number;
  checkout: number;
  /** Curso no título (1 curso filtrado) ou vazio para "cursos perpétuos". */
  titulo?: string;
  /** Rolagem de cada curso, para a tabela quando o período tem mais de um curso. */
  porProduto?: { nome: string; visitas: number; scroll25: number; scroll50: number; scroll75: number; scroll90: number; viuBotao: number }[];
}

/**
 * Até onde as pessoas rolam a página de vendas de cada curso perpétuo e onde desistem (01/10/2026).
 * A tag "LS - Rolagem da página (cursos perpétuos)" do GTM-KDDVP4S dispara LS_Scroll25/50/75/90 e
 * LS_ViuBotaoCompra nas páginas de CPA, C-PRO R, C-PRO I e CFP®; cada curso tem as SUAS conversões
 * personalizadas (LS <curso> - Scroll ..., filtradas pela URL), e o extrator grava em cada linha as do
 * curso da etiqueta PRODUTO da campanha. Atribuído pela Meta ao anúncio, como compra e lead.
 * Mesmo componente do painel do Clever Burrow.
 */
export function ScrollDepth({ visitas, scroll25, scroll50, scroll75, scroll90, viuBotao, checkout, titulo, porProduto = [] }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });

  // Base = quem chegou na página. Evento de rolagem pode passar das visualizações
  // (atribuição diferente, visita sem LP view registrada); a base é o maior dos
  // dois para nenhuma taxa passar de 100%.
  const base = Math.max(visitas, scroll25, viuBotao, 1);
  const semDados = scroll25 + scroll50 + scroll75 + scroll90 + viuBotao === 0;

  const etapas = [
    { label: "Chegaram na página", value: base === 1 && visitas === 0 ? 0 : base, color: "hsl(var(--neon-purple))" },
    { label: "Rolaram 25%", value: scroll25, color: "hsl(var(--neon-magenta))" },
    { label: "Rolaram 50%", value: scroll50, color: "hsl(var(--neon-magenta))" },
    { label: "Rolaram 75%", value: scroll75, color: "hsl(var(--neon-cyan))" },
    { label: "Rolaram 90%", value: scroll90, color: "hsl(var(--neon-cyan))" },
    { label: "Viram o botão de compra", value: viuBotao, color: "hsl(var(--neon-gold))" },
    { label: "Iniciaram o checkout", value: checkout, color: "hsl(var(--neon-orange))" },
  ];

  return (
    <div ref={ref} className="glass-card rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Rolagem da página · {titulo || "cursos perpétuos"}</h3>
        <div className="text-[10px] uppercase tracking-widest text-neon-cyan/80">% de quem chegou na página</div>
      </div>

      {semDados ? (
        <p className="text-sm text-muted-foreground">
          Ainda sem eventos de rolagem neste período. A rolagem das páginas de CPA, C-PRO R, C-PRO I e CFP® conta a
          partir de 01/10/2026 (não é retroativa) e só para as campanhas desses cursos.
        </p>
      ) : (
        <div className="space-y-2.5">
          {etapas.map((e, i) => {
            const pct = base > 0 ? Math.min(1, e.value / base) : 0;
            return (
              <div key={e.label} className="grid grid-cols-[10.5rem_1fr_6.5rem] items-center gap-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{e.label}</div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: e.color, boxShadow: `0 0 12px ${e.color}` }}
                    initial={{ width: 0 }}
                    animate={{ width: inView ? `${pct * 100}%` : 0 }}
                    transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="text-right tabular-nums text-sm">
                  <span style={{ color: e.color }}>{formatNumber(e.value)}</span>
                  <span className="text-muted-foreground/80 text-[11px] ml-1.5">{formatPct(pct * 100)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {porProduto.length > 1 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="text-left font-normal pb-2">Curso</th>
                <th className="text-right font-normal pb-2">Chegaram</th>
                <th className="text-right font-normal pb-2">25%</th>
                <th className="text-right font-normal pb-2">50%</th>
                <th className="text-right font-normal pb-2">75%</th>
                <th className="text-right font-normal pb-2">90%</th>
                <th className="text-right font-normal pb-2">Viu o botão</th>
              </tr>
            </thead>
            <tbody>
              {porProduto.map((p) => {
                const b = Math.max(p.visitas, p.scroll25, p.viuBotao, 1);
                const cel = (v: number) => (
                  <td className="text-right py-1.5">
                    {formatNumber(v)}
                    <span className="text-muted-foreground/70 text-[11px] ml-1">{formatPct(Math.min(1, v / b) * 100)}</span>
                  </td>
                );
                return (
                  <tr key={p.nome} className="border-t border-white/5">
                    <td className="text-left py-1.5 pr-3">{p.nome}</td>
                    <td className="text-right py-1.5">{formatNumber(p.visitas)}</td>
                    {cel(p.scroll25)}
                    {cel(p.scroll50)}
                    {cel(p.scroll75)}
                    {cel(p.scroll90)}
                    {cel(p.viuBotao)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
