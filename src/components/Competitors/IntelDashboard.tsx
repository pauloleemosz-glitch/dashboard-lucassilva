import { useMemo, useState } from "react";
import { AlertCircle, Eye, Megaphone, Users, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIntelAll, useConcorrentesAds } from "@/hooks/useIntelData";
import { useAnunciosDesativados } from "@/hooks/useAnunciosDesativados";
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
  // Some apenas se todos os anúncios do concorrente estiverem desativados
  const intel = useIntelAll(desativadosNomes);

  // Anúncios da data mais recente de cada concorrente (para exibir no bloco)
  const ads = useConcorrentesAds(undefined);   // carrega todos, sem filtro de data

  const isLoading = intel.isLoading || ads.isLoading;
  const error     = intel.error || ads.error;

  // Lista de concorrentes com análise disponível
  const competitors = useMemo(
    () => [...new Set((intel.data ?? []).map((c) => c.concorrente))].sort(),
    [intel.data],
  );

  // Anúncios agrupados por concorrente (usa data mais recente de cada um)
  const adsByComp = useMemo(() => {
    const map = new Map<string, typeof ads.data>([]);
    if (!ads.data) return map;

    // Para cada concorrente, pega somente os anúncios da data mais recente dele
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
    (intel.data ?? []).forEach((c) => {
      const entry = map.get(c.concorrente.trim());
      if (entry) entry.campaigns!.push(c);
    });
    return map;
  }, [intel.data, competitors, adsByComp]);

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
            const nrAds = (intel.data ?? [])
              .filter((i) => i.concorrente === c)
              .reduce((s, i) => s + i.nr_anuncios, 0);
            const dataAnuncio = (intel.data ?? []).find((i) => i.concorrente === c)?.data_anuncios;
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
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard
              label="Concorrentes analisados"
              value={competitors.length}
              icon={Users}
              color="cyan"
            />
            <SummaryCard
              label="Campanhas identificadas"
              value={(intel.data ?? []).length}
              icon={Megaphone}
              color="purple"
            />
            <SummaryCard
              label="Anúncios analisados"
              value={(intel.data ?? []).reduce((s, i) => s + i.nr_anuncios, 0)}
              icon={Eye}
              color="cyan"
            />
          </div>

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
                return (
                  <IntelCompetitorBlock
                    key={name}
                    concorrente={name}
                    campaigns={entry.campaigns ?? []}
                    ads={entry.ads ?? []}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
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
