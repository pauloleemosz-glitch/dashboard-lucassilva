import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarIcon, Eye, Megaphone, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useConcorrentesAds,
  useDatasDisponiveis,
  useIntelByDate,
} from "@/hooks/useIntelData";
import { IntelCompetitorBlock } from "./IntelCompetitorBlock";
import { formatNumber } from "@/utils/parsers";

const COMPETITORS = ["Rafael Toro", "Edgar Abreu", "Meu Certificado"] as const;

export function IntelDashboard() {
  const datas = useDatasDisponiveis();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedComp, setSelectedComp] = useState<string>("all");

  // pré-selecionar a data mais recente
  useEffect(() => {
    if (!selectedDate && datas.data && datas.data.length > 0) {
      setSelectedDate(datas.data[0]);
    }
  }, [datas.data, selectedDate]);

  const intel = useIntelByDate(selectedDate);
  const ads = useConcorrentesAds(selectedDate);

  const isLoading = datas.isLoading || intel.isLoading || ads.isLoading;
  const error = datas.error || intel.error || ads.error;

  // Derivar dinamicamente a lista de concorrentes a partir dos dados
  const competitors = useMemo(() => {
    const set = new Set<string>();
    intel.data?.forEach((c) => c.concorrente && set.add(c.concorrente.trim()));
    ads.data?.forEach((a) => a.concorrente && set.add(a.concorrente.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [intel.data, ads.data]);

  // agrupar por concorrente
  const byCompetitor = useMemo(() => {
    const map = new Map<string, { campaigns: typeof intel.data; ads: typeof ads.data }>();
    for (const name of competitors) {
      map.set(name, { campaigns: [], ads: [] });
    }
    intel.data?.forEach((c) => {
      const entry = map.get(c.concorrente.trim());
      if (entry) entry.campaigns!.push(c);
    });
    ads.data?.forEach((a) => {
      const entry = map.get(a.concorrente.trim());
      if (entry) entry.ads!.push(a);
    });
    return map;
  }, [intel.data, ads.data, competitors]);

  const visibleCompetitors = useMemo(
    () => (selectedComp === "all" ? competitors : [selectedComp]),
    [selectedComp, competitors],
  );

  return (
    <section className="space-y-4">
      {/* Filtros */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-neon-cyan" />
          <Select
            value={selectedDate}
            onValueChange={setSelectedDate}
            disabled={!datas.data || datas.data.length === 0}
          >
            <SelectTrigger className="w-[200px] border-primary/30 hover:border-neon-cyan">
              <SelectValue placeholder="Selecione a data" />
            </SelectTrigger>
            <SelectContent className="glass-card border-primary/30">
              {datas.data?.map((d) => (
                <SelectItem key={d} value={d}>
                  {format(new Date(d), "dd MMM yyyy", { locale: ptBR })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={selectedComp} onValueChange={setSelectedComp}>
          <SelectTrigger className="w-[220px] border-primary/30 hover:border-neon-cyan">
            <SelectValue placeholder="Concorrente" />
          </SelectTrigger>
          <SelectContent className="glass-card border-primary/30">
            <SelectItem value="all">Todos os concorrentes</SelectItem>
            {competitors.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedDate && (
          <div className="ml-auto text-[10px] text-muted-foreground tracking-widest uppercase">
            Data analisada:{" "}
            {format(new Date(selectedDate), "dd MMM yyyy", { locale: ptBR })}
          </div>
        )}
      </div>

      {/* Resumo */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl h-24 skeleton-shimmer" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-neon-orange mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COMPETITORS.map((name) => {
              const entry = byCompetitor.get(name)!;
              const totalAds = entry.ads?.length ?? 0;
              const campanhas = entry.campaigns?.length ?? 0;
              return (
                <SummaryCard
                  key={name}
                  name={name}
                  totalAds={totalAds}
                  campanhas={campanhas}
                />
              );
            })}
          </div>

          {/* Blocos por concorrente */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="glass-card rounded-xl h-48 skeleton-shimmer" />
              <div className="glass-card rounded-xl h-48 skeleton-shimmer" />
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

function SummaryCard({
  name,
  totalAds,
  campanhas,
}: {
  name: string;
  totalAds: number;
  campanhas: number;
}) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3 border border-primary/15 hover:border-primary/40 transition-colors">
      <div className="p-2 rounded-lg bg-background/40 text-neon-purple">
        <Users className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          {name}
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-neon-cyan" />
            <span className="text-xl font-light tabular-nums text-neon-cyan">
              {formatNumber(totalAds)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1">
              anúncios
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Megaphone className="h-3.5 w-3.5 text-neon-purple" />
            <span className="text-base font-light tabular-nums text-neon-purple">
              {formatNumber(campanhas)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1">
              campanhas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
