import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CompetitorGroup as CompetitorGroupType } from "@/hooks/useCompetitorsData";
import { AnuncioDesativado } from "@/hooks/useAnunciosDesativados";
import { CompetitorAdCard } from "./CompetitorAdCard";

interface Props {
  group: CompetitorGroupType;
  defaultOpen?: boolean;
  desativadosReal?: AnuncioDesativado[];
}

export function CompetitorGroup({ group, defaultOpen = false, desativadosReal = [] }: Props) {

  const offCount = desativadosReal.length;

  // Cards visuais mostram somente os anúncios ATIVOS vindos da planilha.
  // Os desativados confirmados (API) são exibidos na tabela abaixo —
  // a heurística antiga (group.desativados) não é mais usada para evitar
  // marcar como off anúncios que ainda estão ativos na biblioteca do Meta.
  const ads = group.ativos;

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
              {offCount > 0 && (
                <span className="px-2 py-1 rounded-full text-neon-orange border border-neon-orange/30 bg-neon-orange/5">
                  {offCount} off
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 space-y-5">
          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
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

          {/* Sub-lista de desativados confirmados (API) */}
          {offCount > 0 && (
            <div className="rounded-xl border border-neon-orange/20 bg-neon-orange/5 overflow-hidden">
              <div className="px-4 py-2 flex items-center gap-2 border-b border-neon-orange/20">
                <span className="text-[10px] uppercase tracking-widest text-neon-orange font-medium">
                  Desativados confirmados ({offCount})
                </span>
                <span className="text-[10px] text-muted-foreground tracking-wider">
                  ausentes por 3+ dias consecutivos
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-background/40 text-muted-foreground uppercase tracking-widest text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2">Data Desativação</th>
                      <th className="text-left px-3 py-2">Última vez ativo</th>
                      <th className="text-right px-3 py-2">Dias ativo</th>
                      <th className="text-left px-3 py-2">Título</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neon-orange/10">
                    {desativadosReal.map((d, i) => (
                      <tr key={i} className="hover:bg-neon-orange/5">
                        <td className="px-3 py-2 whitespace-nowrap text-neon-orange">
                          {d.data_desativacao || "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {d.ultima_vez_ativo || "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {d.dias_ativo ?? "—"}
                        </td>
                        <td className="px-3 py-2 max-w-[420px] truncate text-foreground/90">
                          {d.titulo || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
