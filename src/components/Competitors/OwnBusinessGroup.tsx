import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CompetitorGroup as CompetitorGroupType } from "@/hooks/useCompetitorsData";
import { CompetitorAdCard } from "./CompetitorAdCard";
import { Home } from "lucide-react";

interface Props {
  group: CompetitorGroupType;
  defaultOpen?: boolean;
}

export function OwnBusinessGroup({ group, defaultOpen = true }: Props) {
  const ads = group.ativos;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "own" : undefined}
      className="rounded-xl border border-amber-400/30 bg-amber-400/5"
    >
      <AccordionItem value="own" className="border-0">
        <AccordionTrigger className="px-5 hover:no-underline">
          <div className="flex items-center gap-3 flex-1 text-left">
            <Home className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm tracking-tight text-amber-300 font-medium">
                {group.concorrente}
              </span>
              {group.pagina && group.pagina !== group.concorrente && (
                <span className="text-[10px] uppercase tracking-widest text-amber-400/60">
                  {group.pagina}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="px-2 py-1 rounded-full text-amber-300 border border-amber-400/40 bg-amber-400/10">
                {group.ativos.length} anúncios ativos
              </span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5">
          {ads.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              Nenhum anúncio próprio encontrado. Execute a captura para atualizar.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ads.map((ad) => (
                <CompetitorAdCard key={ad.adId} ad={ad} highlight="own" />
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
