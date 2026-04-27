import { CompetitorGroup as CompetitorGroupType } from "@/hooks/useCompetitorsData";
import { Home } from "lucide-react";

interface Props {
  group: CompetitorGroupType;
  defaultOpen?: boolean;
}

export function OwnBusinessGroup({ group }: Props) {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-5 py-4">
      <div className="flex items-center gap-3 text-left">
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
    </div>
  );
}

