import { useMemo, useState } from "react";
import {
  AlertCircle, Eye, Megaphone, Users, CalendarIcon,
  Home, Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIntelAll, useConcorrentesAds } from "@/hooks/useIntelData";
import { useAnunciosDesativados } from "@/hooks/useAnunciosDesativados";
import { useComparacoes } from "@/hooks/useComparacoes";
import { IntelCompetitorBlock } from "./IntelCompetitorBlock";
import { formatNumber } from "@/utils/parsers";

export function IntelDashboard() {
  const [selectedComp, setSelectedComp] = useState<string>("all");

  // Nomes de concorrentes que tiveram anúncios desativados
  const desativados = useAnunciosDesativados();
  const desativadosNomes = useMemo(() => {
    const s = new Set<string>();
    (desativados.data ?? []).forEach((d) => {
      if (d.concorrente) s.add(d.concorrente.trim());
    });
    return s;
  }, [desativados.data]);

  // Análise mais recente por concorrente (independente de data)
  const intel = useIntelAll(desativadosNomes);

  // Anúncios da data mais recente de cada concorrente
  const ads = useConcorrentesAds(undefined);

  // Comparações LS Certificacoes vs concorrentes
  const comparacoes = useComparacoes();

  const isLoading = intel.isLoading || ads.isLoading;
  const error     = intel.error || ads.error;

  // Separar análise de LS Certificacoes (próprio) da de concorrentes
  const PROPRIO_NOME = "LS Certificacoes";

  const ownCampaigns = useMemo(
    () => (intel.data ?? []).filter((c) => c.concorrente === PROPRIO_NOME),
    [intel.data],
  );

  const competitorCampaigns = useMemo(
    () => (intel.data ?? []).filter((c) => c.concorrente !== PROPRIO_NOME),
    [intel.data],
  );

  // Lista de concorrentes com análise disponível
  const competitors = useMemo(
    () => [...new Set(competitorCampaigns.map((c) => c.concorrente))].sort(),
    [competitorCampaigns],
  );

  // Anúncios agrupados por concorrente (usa data mais recente de cada um)
  const adsByComp = useMemo(() => {
    const map = new Map<string, typeof ads.data>([]);
    if (!ads.data) return map;

    const compMaxDate = new Map<string, string>();
    for (const a of ads.data) {
      const cur = compMaxDate.get(a.concorrente);
      if (!cur || a.data > cur) compMaxDate.set(a.concorrente, a.data);
    }
    for (const a of ads.data) {
      const max = compMaxDate.get(a.concorrente);
      if (a.data !== max) continue;
      const arr = map.get(a.concorrente) ?? [];
      arr.push(a);
      map.set(a.concorrente, arr);
    }
    return map;
  }, [ads.data]);

  // Agrupa análises por concorrente
  const byCompetitor = useMemo(() => {
    const map = new Map<string, { campaigns: typeof intel.data; ads: typeof ads.data }>();
    for (const name of competitors) {
      map.set(name, { campaigns: [], ads: adsByComp.get(name) ?? [] });
    }
    competitorCampaigns.forEach((c) => {
      const entry = map.get(c.concorrente.trim());
      if (entry) entry.campaigns!.push(c);
    });
    return map;
  }, [competitorCampaigns, competitors, adsByComp]);

  const ownAds = adsByComp.get(PROPRIO_NOME) ?? [];

  const visibleCompetitors = useMemo(
    () => (selectedComp === "all" ? competitors : [selectedComp]),
    [selectedComp, competitors],
  );

  return (
    <section className="space-y-4">
      {/* Filtro de concorrente */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-widest">
          <Users className="h-4 w-4 text-neon-cyan" />
          Concorrente
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="Todos"
            count={competitors.length}
            active={selectedComp === "all"}
            onClick={() => setSelectedComp("all")}
          />
          {competitors.map((c) => {
            const nrAds = competitorCampaigns
              .filter((i) => i.concorrente === c)
              .reduce((s, i) => s + i.nr_anuncios, 0);
            const dataAnuncio = competitorCampaigns.find((i) => i.concorrente === c)?.data_anuncios;
            return (
              <FilterChip
                key={c}
                label={c}
                count={nrAds || undefined}
                date={dataAnuncio}
                active={selectedComp === c}
                onClick={() => setSelectedComp((cur) => (cur === c ? "all" : c))}
              />
            );
          })}
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-28 skeleton-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-neon-orange mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      ) : (
        <>
          {/* KPI cards — apenas concorrentes */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard
              label="Concorrentes analisados"
              value={competitors.length}
              icon={Users}
              color="cyan"
            />
            <SummaryCard
              label="Campanhas identificadas"
              value={competitorCampaigns.length}
              icon={Megaphone}
              color="purple"
            />
            <SummaryCard
              label="Anúncios analisados"
              value={competitorCampaigns.reduce((s, i) => s + i.nr_anuncios, 0)}
              icon={Eye}
              color="cyan"
            />
          </div>

          {/* Nossa Estratégia — sempre pinned at top */}
          {selectedComp === "all" && ownCampaigns.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400/80">
                <Home className="h-3 w-3" />
                Nossa estratégia
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-3">
                <IntelCompetitorBlock
                  concorrente={PROPRIO_NOME}
                  campaigns={ownCampaigns}
                  ads={ownAds}
                  isOwn
                />
              </div>
            </div>
          )}

          {/* Divider */}
          {selectedComp === "all" && ownCampaigns.length > 0 && competitors.length > 0 && (
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-primary/20" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Análise de concorrentes
              </span>
              <div className="h-px flex-1 bg-primary/20" />
            </div>
          )}

          {/* Blocos por concorrente */}
          {visibleCompetitors.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground text-sm">
              Nenhuma análise disponível.
            </div>
          ) : (
            <div className="space-y-6">
              {visibleCompetitors.map((name) => {
                const entry = byCompetitor.get(name);
                if (!entry) return null;
                const comp = comparacoes.data?.get(name);
                return (
                  <div key={name} className="space-y-3">
                    <IntelCompetitorBlock
                      concorrente={name}
                      campaigns={entry.campaigns ?? []}
                      ads={entry.ads ?? []}
                    />
                    {comp && (
                      <ComparisonBlock comparacao={comp} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── Bloco de comparação IA ──────────────────────────────────────

function ComparisonBlock({ comparacao }: { comparacao: import("@/hooks/useComparacoes").Comparacao }) {
  const [open, setOpen] = useState(false);
  const hasDiff = comparacao.diferenciais_nossos.length > 0
    || comparacao.diferenciais_concorrente.length > 0
    || comparacao.oportunidades.length > 0;

  if (!comparacao.resumo_comparativo && !hasDiff) return null;

  return (
    <div className="rounded-xl border border-neon-purple/25 bg-neon-purple/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center gap-2 text-left hover:bg-neon-purple/10 transition-colors rounded-xl"
      >
        <Zap className="h-4 w-4 text-neon-purple shrink-0" />
        <span className="text-[11px] uppercase tracking-widest text-neon-purple font-medium flex-1">
          O que fazemos diferente
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-neon-purple/60" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neon-purple/60" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Resumo */}
          {comparacao.resumo_comparativo && (
            <p className="text-sm text-foreground/85 leading-relaxed">
              {comparacao.resumo_comparativo}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Nossos diferenciais */}
            {comparacao.diferenciais_nossos.length > 0 && (
              <DiffList
                title="Nossos diferenciais"
                items={comparacao.diferenciais_nossos}
                color="amber"
              />
            )}
            {/* Diferenciais do concorrente */}
            {comparacao.diferenciais_concorrente.length > 0 && (
              <DiffList
                title="Diferenciais do concorrente"
                items={comparacao.diferenciais_concorrente}
                color="cyan"
              />
            )}
            {/* Oportunidades */}
            {comparacao.oportunidades.length > 0 && (
              <DiffList
                title="Oportunidades"
                items={comparacao.oportunidades}
                color="purple"
              />
            )}
          </div>

          {comparacao.data && (
            <div className="text-[10px] text-muted-foreground/60 text-right">
              Análise de {format(new Date(comparacao.data), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DiffList({ title, items, color }: {
  title: string;
  items: string[];
  color: "amber" | "cyan" | "purple";
}) {
  const colorMap = {
    amber:  { dot: "bg-amber-400", label: "text-amber-300", border: "border-amber-400/20 bg-amber-400/5" },
    cyan:   { dot: "bg-neon-cyan",  label: "text-neon-cyan",  border: "border-neon-cyan/20 bg-neon-cyan/5" },
    purple: { dot: "bg-neon-purple",label: "text-neon-purple",border: "border-neon-purple/20 bg-neon-purple/5" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${c.border}`}>
      <div className={`text-[10px] uppercase tracking-widest font-medium ${c.label}`}>{title}</div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────

function FilterChip({
  label, count, date, active, onClick,
}: {
  label: string;
  count?: number;
  date?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
        active
          ? "border-neon-cyan/70 bg-neon-cyan/10 text-neon-cyan"
          : "border-primary/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-[10px] ${active ? "text-neon-cyan/70" : "text-muted-foreground/60"}`}>
          ({count})
        </span>
      )}
      {date && (
        <span className={`flex items-center gap-0.5 text-[10px] ${active ? "text-neon-cyan/60" : "text-muted-foreground/50"}`}>
          <CalendarIcon className="h-2.5 w-2.5" />
          {format(new Date(date), "dd/MM", { locale: ptBR })}
        </span>
      )}
    </button>
  );
}

function SummaryCard({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "cyan" | "purple";
}) {
  const c = color === "cyan" ? "text-neon-cyan" : "text-neon-purple";
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-background/40 ${c}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={`text-xl font-light tabular-nums ${c}`}>{formatNumber(value)}</div>
      </div>
    </div>
  );
}
