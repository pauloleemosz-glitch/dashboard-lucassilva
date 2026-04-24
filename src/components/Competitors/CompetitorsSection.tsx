import { Eye, Activity, XCircle, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCompetitorsData } from "@/hooks/useCompetitorsData";
import { CompetitorGroup } from "./CompetitorGroup";
import { formatNumber } from "@/utils/parsers";

export function CompetitorsSection() {
  const { data, isLoading, error, refetch } = useCompetitorsData();

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-light tracking-tight">
            <span className="neon-text-purple">Inteligência</span>{" "}
            <span className="text-foreground">Competitiva</span>
          </h2>
          <p className="text-[11px] text-muted-foreground tracking-wider uppercase mt-1">
            Anúncios ativos dos concorrentes na biblioteca do Meta
          </p>
        </div>
        {data?.latestExtraction && (
          <div className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Última extração: {format(data.latestExtraction, "dd MMM yyyy", { locale: ptBR })}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl h-20 skeleton-shimmer" />
            ))}
          </div>
          <div className="glass-card rounded-xl h-32 skeleton-shimmer" />
          <div className="glass-card rounded-xl h-32 skeleton-shimmer" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertCircle className="h-8 w-8 text-neon-orange mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded border border-primary/40 text-neon-cyan hover:bg-primary/10 text-xs"
          >
            Tentar novamente
          </button>
        </div>
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryKpi label="Concorrentes" value={data.totals.concorrentes} icon={Users} color="cyan" />
            <SummaryKpi label="Anúncios" value={data.totals.total} icon={Eye} color="purple" />
            <SummaryKpi label="Ativos" value={data.totals.ativos} icon={Activity} color="cyan" pulse />
            <SummaryKpi label="Desativados" value={data.totals.desativados} icon={XCircle} color="orange" />
          </div>

          {/* Groups */}
          {data.groups.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground text-sm">
              Nenhum anúncio de concorrente encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {data.groups.map((g, i) => (
                <CompetitorGroup key={g.concorrente} group={g} defaultOpen={i === 0} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

function SummaryKpi({
  label,
  value,
  icon: Icon,
  color,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "cyan" | "purple" | "orange";
  pulse?: boolean;
}) {
  const colorMap = {
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    orange: "text-neon-orange",
  };
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-background/40 ${colorMap[color]}`}>
        <Icon className={`h-4 w-4 ${pulse ? "animate-pulse" : ""}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          {label}
        </div>
        <div className={`text-xl sm:text-2xl font-light tabular-nums ${colorMap[color]}`}>
          {formatNumber(value)}
        </div>
      </div>
    </div>
  );
}
