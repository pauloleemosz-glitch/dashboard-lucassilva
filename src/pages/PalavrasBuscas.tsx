import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Lightbulb, RefreshCw } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { ChartCard, NeonTooltip } from "@/components/Charts/ChartCard";
import { DataTable, Column } from "@/components/Google/DataTable";
import { useGoogleAdsData } from "@/hooks/useGoogleAdsData";
import {
  agregarKeywords, agregarPalavras, agregarTermos, KwAgg, leituras, norm, PalavraAgg, serieDiaria, tendencias, TermoAgg,
} from "@/utils/palavrasBuscas";
import { formatBRL, formatNumber, formatPct } from "@/utils/parsers";
import logo from "@/assets/logo.svg";

const PERIODOS = [7, 14, 30];
const brl = (v: any) => (v === null || v === undefined ? "—" : formatBRL(v));
const num = (v: any) => (v === null || v === undefined ? "—" : formatNumber(v, 0));
const num1 = (v: any) => (!v ? "—" : formatNumber(v, v < 10 ? 1 : 0));
const pct = (v: any) => (v === null || v === undefined ? "—" : formatPct(v));

function Kpi({ label, valor, nota }: { label: string; valor: string; nota?: string }) {
  return (
    <div className="glass-card rounded-xl p-4 min-w-0">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xl md:text-2xl font-light text-neon-cyan mt-1 tabular-nums">{valor}</div>
      {nota && <div className="text-[10px] text-muted-foreground/80 mt-1 leading-snug">{nota}</div>}
    </div>
  );
}

function ListaTendencia({ titulo, itens, alta }: { titulo: string; itens: ReturnType<typeof tendencias>["alta"]; alta: boolean }) {
  const Icone = alta ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="glass-card rounded-xl p-5 min-w-0">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-1">{titulo}</h3>
      <p className="text-[10px] text-muted-foreground/80 mb-3">Impressões: 7 dias anteriores → últimos 7 dias</p>
      {itens.length === 0 && <div className="text-xs text-muted-foreground py-4">Sem variação relevante.</div>}
      <ul className="space-y-1.5">
        {itens.map((t) => (
          <li key={t.term} className="flex items-center gap-2 text-xs min-w-0">
            <Icone className={`h-3.5 w-3.5 shrink-0 ${alta ? "text-neon-cyan" : "text-neon-orange"}`} />
            <span className="truncate flex-1 min-w-0" title={t.term}>{t.term}</span>
            <span className="tabular-nums text-muted-foreground whitespace-nowrap">
              {formatNumber(t.antes)} → <span className="text-foreground">{formatNumber(t.agora)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PalavrasBuscas() {
  const { data, isLoading, error, refetch, isFetching } = useGoogleAdsData();
  const [dias, setDias] = useState(30);
  const [curso, setCurso] = useState("Todos");

  const fimDados = useMemo(() => {
    let max = 0;
    for (const r of data?.searchTerms || []) if (r.date && r.date.getTime() > max) max = r.date.getTime();
    return max ? new Date(max) : new Date();
  }, [data]);

  const cursos = useMemo(() => {
    const s = new Set<string>();
    for (const r of data?.searchTerms || []) s.add(r.curso);
    return ["Todos", ...Array.from(s).sort()];
  }, [data]);

  const filtro = useMemo(() => {
    const f = <T extends { curso: string }>(arr: T[]) => (curso === "Todos" ? arr : arr.filter((r) => r.curso === curso));
    return {
      st: f(data?.searchTerms || []),
      ct: f(data?.convTerms || []),
      kw: f(data?.keywords || []),
      ck: f(data?.convKeywords || []),
    };
  }, [data, curso]);

  const janela = useMemo(() => {
    const fim = new Date(fimDados.getFullYear(), fimDados.getMonth(), fimDados.getDate(), 23, 59, 59);
    const ini = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() - (dias - 1));
    return { ini, fim };
  }, [fimDados, dias]);

  const termos = useMemo(() => agregarTermos(filtro.st, filtro.ct, janela), [filtro, janela]);
  const palavras = useMemo(() => agregarPalavras(termos), [termos]);
  const tend = useMemo(() => tendencias(filtro.st, janela.fim), [filtro, janela]);
  const kwRows = useMemo(() => agregarKeywords(filtro.kw, filtro.ck, janela), [filtro, janela]);
  const diario = useMemo(() => serieDiaria(filtro.st, filtro.ct, janela), [filtro, janela]);
  const kwSet = useMemo(() => new Set((data?.keywords || []).map((k) => norm(k.keyword))), [data]);
  const textos = useMemo(() => leituras(termos, palavras, tend, kwSet), [termos, palavras, tend, kwSet]);

  const tot = useMemo(() => {
    const t = { custo: 0, cliques: 0, compras: 0, receita: 0, visitas: 0, custoMarca: 0 };
    for (const r of termos) {
      t.custo += r.cost;
      t.cliques += r.clicks;
      t.compras += r.compras;
      t.receita += r.receita;
      t.visitas += r.visitas;
      if (r.marca) t.custoMarca += r.cost;
    }
    return t;
  }, [termos]);

  const semRetorno = useMemo(() => termos.filter((t) => t.compras === 0 && t.cost > 0), [termos]);
  const oportunidades = useMemo(() => termos.filter((t) => t.compras > 0 && !kwSet.has(norm(t.term))), [termos, kwSet]);
  const palavrasVendem = useMemo(() => palavras.filter((p) => p.compras > 0), [palavras]);
  const palavrasGastam = useMemo(() => palavras.filter((p) => p.compras === 0 && p.cost > 0), [palavras]);
  const semConvAbas = !!data && data.convTerms.length === 0;

  const termCols: Column<TermoAgg>[] = [
    { key: "term", label: "Termo de busca", align: "left", minWidth: 220 },
    { key: "cursos", label: "Curso", align: "left" },
    { key: "impressions", label: "Impressões", format: num },
    { key: "clicks", label: "Cliques", format: num },
    { key: "ctr", label: "CTR", format: pct },
    { key: "cpc", label: "CPC", format: brl },
    { key: "cost", label: "Custo", format: brl },
    { key: "visitas", label: "Visitas pág.", format: num },
    { key: "compras", label: "Compras", format: num1 },
    { key: "receita", label: "Receita", format: (v) => (v ? formatBRL(v) : "—") },
  ];
  const opCols: Column<TermoAgg>[] = [
    { key: "term", label: "Busca que vendeu", align: "left", minWidth: 220 },
    { key: "keywords", label: "Palavra-chave que acionou", align: "left", minWidth: 160 },
    { key: "cursos", label: "Curso", align: "left" },
    { key: "clicks", label: "Cliques", format: num },
    { key: "cost", label: "Custo", format: brl },
    { key: "compras", label: "Compras", format: num1 },
    { key: "receita", label: "Receita", format: (v) => (v ? formatBRL(v) : "—") },
    { key: "custoCompra", label: "Custo / compra", format: brl },
  ];
  const palCols: Column<PalavraAgg>[] = [
    { key: "palavra", label: "Palavra", align: "left", minWidth: 120 },
    { key: "buscas", label: "Buscas", format: num },
    { key: "clicks", label: "Cliques", format: num },
    { key: "cost", label: "Custo", format: brl },
    { key: "compras", label: "Compras", format: num1 },
    { key: "receita", label: "Receita", format: (v) => (v ? formatBRL(v) : "—") },
  ];
  const kwCols: Column<KwAgg>[] = [
    { key: "keyword", label: "Palavra-chave", align: "left", minWidth: 180 },
    { key: "matchType", label: "Correspondência", align: "left" },
    { key: "curso", label: "Curso", align: "left" },
    { key: "qualityScore", label: "Qualidade", format: (v) => (v > 0 ? `${v}/10` : "—") },
    { key: "clicks", label: "Cliques", format: num },
    { key: "cpc", label: "CPC", format: brl },
    { key: "cost", label: "Custo", format: brl },
    { key: "visitas", label: "Visitas pág.", format: num },
    { key: "compras", label: "Compras", format: num1 },
    { key: "custoCompra", label: "Custo / compra", format: brl },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5 relative">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <h1 className="text-2xl md:text-3xl font-light tracking-tight gradient-text-anim">GOOGLE // PALAVRAS E BUSCAS</h1>
        <img src={logo} alt="LS Certificações" className="h-10 md:h-12 w-auto float-soft glow-breathe" />
      </motion.header>

      <TopNav />

      <div className="flex items-center gap-2 flex-wrap">
        {PERIODOS.map((d) => (
          <button
            key={d}
            onClick={() => setDias(d)}
            className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider border transition-all ${
              dias === d ? "bg-primary/15 text-neon-cyan border-primary/40" : "text-muted-foreground border-primary/20 hover:text-foreground"
            }`}
          >
            {d} dias
          </button>
        ))}
        <select
          value={curso}
          onChange={(e) => setCurso(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-background/60 border border-primary/30 text-foreground"
        >
          {cursos.map((c) => (
            <option key={c} value={c}>{c === "Todos" ? "Todos os cursos" : c}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg text-xs border border-primary/20 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </button>
        {data && (
          <span className="text-[10px] text-muted-foreground">
            Dados até {formatNumber(fimDados.getDate())}/{String(fimDados.getMonth() + 1).padStart(2, "0")} · atualiza de hora em hora
          </span>
        )}
      </div>

      {isLoading && <div className="glass-card rounded-xl p-6 text-sm text-muted-foreground">Carregando dados do Google Ads…</div>}
      {error && <div className="glass-card rounded-xl p-6 text-sm text-neon-orange">Não consegui ler a planilha do Google Ads: {String((error as Error).message)}</div>}
      {semConvAbas && (
        <div className="glass-card rounded-xl p-4 text-xs text-neon-orange">
          As abas de conversão por tipo ainda não chegaram na planilha. Compras e visitas aparecem depois da próxima execução do script do Google Ads.
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Kpi label="Custo em buscas" valor={formatBRL(tot.custo)} nota={`${formatNumber(tot.cliques)} cliques`} />
            <Kpi label="Compras" valor={formatNumber(tot.compras, 1)} nota="Compra no site (GA4), atribuída ao termo pelo Google" />
            <Kpi label="Receita" valor={formatBRL(tot.receita)} nota={tot.compras > 0 ? `Custo por compra ${formatBRL(tot.custo / tot.compras)}` : undefined} />
            <Kpi label="Visitas de página" valor={formatNumber(tot.visitas)} nota="Era o que as campanhas otimizavam até 04/10" />
            <Kpi
              label="Gasto em buscas de marca"
              valor={tot.custo ? formatPct((tot.custoMarca / tot.custo) * 100, 0) : "—"}
              nota="Buscas com o nome do Lucas"
            />
          </div>

          {textos.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 inline-flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-neon-cyan" /> Leituras do período
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5">
                {textos.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          <ChartCard title="Custo × compras × visitas por dia" nota="Visitas no eixo da direita, em escala própria">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={diario} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--neon-cyan))" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke="hsl(var(--neon-cyan))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" stroke="hsl(var(--neon-purple))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<NeonTooltip formatValue={(v: number, k: string) => (k === "custo" ? formatBRL(v) : formatNumber(v, k === "compras" ? 1 : 0))} />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar yAxisId="l" dataKey="custo" name="Custo" fill="hsl(var(--neon-cyan))" fillOpacity={0.35} />
                <Line yAxisId="r" type="monotone" dataKey="visitas" name="Visitas de página" stroke="hsl(var(--neon-purple))" strokeWidth={2} dot={false} />
                <Line yAxisId="l" type="monotone" dataKey="compras" name="Compras" stroke="hsl(var(--neon-orange))" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ListaTendencia titulo="Em alta" itens={tend.alta} alta />
            <ListaTendencia titulo="Em queda" itens={tend.queda} alta={false} />
          </div>

          <DataTable title="Gasto sem retorno · candidatos a palavra negativa" columns={termCols} rows={semRetorno} initialSortKey="cost" />
          <DataTable title="Oportunidades · buscas que venderam e não são palavra-chave" columns={opCols} rows={oportunidades} initialSortKey="compras" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-w-0">
              <DataTable title="Palavras dentro das buscas que vendem" columns={palCols} rows={palavrasVendem} initialSortKey="compras" />
            </div>
            <div className="min-w-0">
              <DataTable title="Palavras que só aparecem em buscas sem venda" columns={palCols} rows={palavrasGastam} initialSortKey="cost" />
            </div>
          </div>

          <DataTable title="Todos os termos de busca" columns={termCols} rows={termos} initialSortKey="cost" />
          <DataTable title="Palavras-chave" columns={kwCols} rows={kwRows} initialSortKey="cost" />
        </>
      )}
    </div>
  );
}
