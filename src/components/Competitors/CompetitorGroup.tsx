import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CompetitorGroup as CompetitorGroupType } from "@/hooks/useCompetitorsData";
import { CompetitorAdCard } from "./CompetitorAdCard";
import { cn } from "@/lib/utils";

interface Props {
  group: CompetitorGroupType;
  defaultOpen?: boolean;
}

type Filter = "todos" | "ativos" | "desativados";

export function CompetitorGroup({ group, defaultOpen = false }: Props) {
  const [filter, setFilter] = useState<Filter>("ativos");

  const ads =
    filter === "ativos"
      ? group.ativos
      : filter === "desativados"
      ? group.desativados
      : [...group.ativos, ...group.desativados];

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? group.concorrente : undefined}
      className="glass-card rounded-xl border-neon-cyan/20"
    >
      <AccordionItem value={group.concorrente} className="border-0">
        <AccordionTrigger className="px-5 hover:no-underline">
          <div className="flex items-center gap-3 flex-1 text-left">
            <div className="flex flex-col">
              <span className="text-sm tracking-tight text-foreground">{group.concorrente}</span>
              {group.pagina && group.pagina !== group.concorrente && (
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group.pagina}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="px-2 py-1 rounded-full text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5">
                {group.ativos.length} ativos
              </span>
              <span className="px-2 py-1 rounded-full text-neon-orange border border-neon-orange/30 bg-neon-orange/5">
                {group.desativados.length} off
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {(["ativos", "desativados", "todos"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition-colors",
                  filter === f
                    ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                    : "border-primary/20 text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/40",
                )}
              >
                {f === "ativos"
                  ? `Ativos (${group.ativos.length})`
                  : f === "desativados"
                  ? `Desativados (${group.desativados.length})`
                  : `Todos (${group.ativos.length + group.desativados.length})`}
              </button>
            ))}
          </div>

          {ads.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              Nenhum anúncio para este filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ads.map((ad) => (
                <CompetitorAdCard key={ad.adId} ad={ad} />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
