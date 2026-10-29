import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { formatNumber, formatPct } from "@/utils/parsers";
import type { PesquisaMA0911 as Dados, PesquisaPublico, Publico } from "@/hooks/usePesquisaMA0911";

const COR = { Quente: "hsl(var(--neon-cyan))", Frio: "hsl(var(--neon-magenta))" };

const achar = (p: PesquisaPublico | undefined, trecho: string) =>
  p?.perguntas.find((q) => q.pergunta.toLowerCase().includes(trecho.toLowerCase()));

/** % de quem respondeu `resposta` (começo do texto) na pergunta que contém `trecho`. */
function pct(p: PesquisaPublico | undefined, trecho: string, resposta: string) {
  const q = achar(p, trecho);
  if (!q || !p?.respostas) return null;
  const n = q.respostas.filter((r) => r.resposta.toLowerCase().startsWith(resposta.toLowerCase())).reduce((s, r) => s + r.qtd, 0);
  return (100 * n) / p.respostas;
}

const DESTAQUES: { rotulo: string; calc: (p?: PesquisaPublico) => number | null }[] = [
  { rotulo: "Respostas ÷ inscritos do formulário*", calc: (p) => (p && p.inscritos ? (100 * p.respostas) / p.inscritos : null) },
  { rotulo: "Têm cartão de crédito", calc: (p) => pct(p, "cartão", "Sim") },
  { rotulo: "Não trabalham no mercado", calc: (p) => pct(p, "trabalha no mercado", "Não") },
  { rotulo: "Sem nenhuma certificação", calc: (p) => pct(p, "certificação você possui", "Nenhuma") },
  { rotulo: "Conheceram o Lucas há menos de 1 mês", calc: (p) => pct(p, "conhece o Lucas", "Eu conheci há menos") },
  { rotulo: "Renda até R$ 2 mil ou sem renda", calc: (p) => {
      const a = pct(p, "renda", "Atualmente não"), b = pct(p, "renda", "Até R$ 1.000"), c = pct(p, "renda", "De R$ 1.001");
      return a === null ? null : (a || 0) + (b || 0) + (c || 0);
    } },
];

const NOTAS = [
  { rotulo: "Nota A", faixas: ["A"] },
  { rotulo: "Nota B", faixas: ["B"] },
  { rotulo: "A + B (bem pontuados)", faixas: ["A", "B"] },
];

const BLOCOS: { titulo: string; trecho: string }[] = [
  { titulo: "O que mais preocupa", trecho: "preocupa" },
  { titulo: "Objetivo para 2027", trecho: "objetivo" },
  { titulo: "O que mais atrapalha", trecho: "impedi" },
  { titulo: "Renda atual", trecho: "renda" },
  { titulo: "Idade", trecho: "anos você tem" },
  { titulo: "Onde conheceu o Lucas", trecho: "onde você conheceu" },
];

function Barra({ v, cor, ativo, i }: { v: number; cor: string; ativo: boolean; i: number }) {
  return (
    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }}
        initial={{ width: 0 }} animate={{ width: ativo ? `${Math.min(100, v)}%` : 0 }}
        transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/**
 * Pesquisa dos leads de um lançamento (28/10/2026, MA-0911; 29/10, todos com pesquisa). Só aparece quando o filtro
 * de curso tem apenas campanhas daquele lançamento.
 * Quente e frio têm pesquisas separadas (uma em cada página de obrigado); a porcentagem é sobre quem respondeu.
 * Acompanha o período escolhido (dia em que a pessoa respondeu; atualiza de hora em hora).
 */
/** `publicos` acompanha o filtro de campanha: só quente, só frio, ou os dois. */
/** `filtroProduto` (29/10): só parte das campanhas do lançamento está marcada no filtro. */
export function PesquisaMA0911({ dados, lancamento = "Missão ANBIMA 09/11", publicos = ["Quente", "Frio"], filtroProduto = false }: { dados: Dados | undefined; lancamento?: string; publicos?: Publico[]; filtroProduto?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const ativo = useInView(ref, { amount: 0.15 });
  const Q = publicos.includes("Quente") ? dados?.Quente : undefined;
  const F = publicos.includes("Frio") ? dados?.Frio : undefined;
  const separa = [Q, F].some((p) => p?.porCampanha);
  const fora = (Q?.foraDoFiltro || 0) + (F?.foraDoFiltro || 0);
  if (!Q && !F) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Pesquisa dos leads · {lancamento}</h3>
        <p className="text-sm text-muted-foreground mt-3">{!dados ? "Carregando as respostas da pesquisa…" : filtroProduto ? "Nenhum inscrito das campanhas escolhidas respondeu a pesquisa no período (campanha de venda ou de lembrete não gera inscrição)." : "Nenhuma resposta deste público no período escolhido."}</p>
      </div>
    );
  }
  return (
    <div ref={ref} className="glass-card rounded-xl p-5 relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Pesquisa dos leads · {lancamento}</h3>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
          {(["Quente", "Frio"] as const).filter((k) => publicos.includes(k)).map((k) => dados?.[k] && (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: COR[k] }} />
              <span style={{ color: COR[k] }}>{k}</span>
              <span className="text-muted-foreground">{formatNumber(dados[k]!.respostas)} respostas</span>
            </span>
          ))}
        </div>
      </div>

      {/* 29/10 (Paulo): nota do lead scoring — quantos tiraram A e B (a % é sobre quem foi pontuado no período) */}
      <div className="text-[11px] uppercase tracking-widest text-neon-cyan/80 mb-2.5">Nota do lead (score)</div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {NOTAS.map((nota) => (
          <div key={nota.rotulo} className="rounded-lg bg-white/[0.03] border border-white/5 p-3 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{nota.rotulo}</div>
            {([["Quente", Q], ["Frio", F]] as const).map(([k, p]) => {
              if (!p) return null;
              const total = Object.values(p.faixas).reduce((s, v) => s + v, 0);
              const n = nota.faixas.reduce((s, f) => s + (p.faixas[f] || 0), 0);
              return (
                <div key={k} className="flex items-baseline gap-2 tabular-nums" style={{ color: COR[k] }}>
                  <span className={k === "Quente" ? "text-xl" : "text-sm"}>{formatNumber(n)}</span>
                  <span className="text-[11px] opacity-80">{total ? formatPct((100 * n) / total, 0) : "—"}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {DESTAQUES.map((d) => {
          const q = d.calc(Q), f = d.calc(F);
          if (q === null && f === null) return null;   // pesquisa daquele lançamento não tinha essa pergunta
          return (
            <div key={d.rotulo} className="rounded-lg bg-white/[0.03] border border-white/5 p-3 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{d.rotulo}</div>
              <div className="flex items-baseline gap-3 tabular-nums">
                {q !== null && <span className="text-xl" style={{ color: COR.Quente }}>{formatPct(q, 0)}</span>}
                {f !== null && <span className="text-sm" style={{ color: COR.Frio }}>{formatPct(f, 0)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        {BLOCOS.map((b) => {
          const qq = achar(Q, b.trecho), ff = achar(F, b.trecho);
          if (!qq && !ff) return null;
          const nomes = [...new Set([...(qq?.respostas || []), ...(ff?.respostas || [])].map((r) => r.resposta))]
            .filter((n) => n !== "Outros");
          const v = (p: PesquisaPublico | undefined, n: string) => {
            const r = achar(p, b.trecho)?.respostas.find((x) => x.resposta === n);
            return p?.respostas ? (100 * (r?.qtd || 0)) / p.respostas : 0;
          };
          const linhas = nomes.map((n) => ({ n, q: v(Q, n), f: v(F, n) })).sort((a, c) => c.q - a.q).slice(0, 6);
          return (
            <div key={b.titulo} className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-neon-cyan/80 mb-2.5">{b.titulo}</div>
              <div className="space-y-2">
                {linhas.map((l, i) => (
                  <div key={l.n} className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3 items-center">
                    <div className="min-w-0">
                      <div className="text-xs truncate mb-1" title={l.n}>{l.n}</div>
                      <div className="space-y-1">
                        {Q && <Barra v={l.q} cor={COR.Quente} ativo={ativo} i={i} />}
                        {F && <Barra v={l.f} cor={COR.Frio} ativo={ativo} i={i} />}
                      </div>
                    </div>
                    <div className="text-right tabular-nums text-xs leading-5">
                      {Q && <div style={{ color: COR.Quente }}>{formatPct(l.q, 0)}</div>}
                      {F && <div style={{ color: COR.Frio }}>{formatPct(l.f, 0)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground mt-5">
        Porcentagem sobre quem respondeu, em cada público, contando só as respostas enviadas no período escolhido acima
        (atualizado em {Q?.atualizado || F?.atualizado}). "Objetivo" e "O que mais atrapalha" são respostas abertas agrupadas por tema;
        a mesma pessoa pode cair em mais de um. A nota do lead vem do lead scoring dos lançamentos anteriores (no teste,
        7% dos leads A e B compraram, contra 2% a 3% dos C e D); a porcentagem dela é sobre quem foi pontuado, contando cada e-mail
        uma vez só.{" * Respostas do período ÷ inscritos do formulário no mesmo período (quem se inscreve num dia pode responder no outro)."}
        {filtroProduto && separa && ` Só as respostas de quem se inscreveu pelas campanhas marcadas no filtro (ligadas pelo e-mail ou telefone do formulário); ${formatNumber(fora)} respostas de outras campanhas ou sem campanha (página da aula, orgânico) ficaram fora.`}
        {filtroProduto && !separa && " Este lançamento não separa a pesquisa por campanha (a Meta só guarda as inscrições dos últimos 90 dias): mostra o lançamento inteiro."}
        {!filtroProduto && Q && " A pesquisa do quente também recebe quem se inscreveu pela página da aula, então essa proporção do quente fica acima da taxa real de resposta."}
      </p>
    </div>
  );
}
