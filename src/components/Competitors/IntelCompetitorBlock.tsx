import { Sparkles } from "lucide-react";
import { CompetitorAdRow, IntelCampaign, firstDriveLink } from "@/hooks/useIntelData";
import { IntelCreativeCard } from "./IntelCreativeCard";
import { DragCarousel } from "./DragCarousel";

interface Props {
  concorrente: string;
  campaigns: IntelCampaign[];
  ads: CompetitorAdRow[];
  isOwn?: boolean;
}

export function IntelCompetitorBlock({ concorrente, campaigns, ads, isOwn }: Props) {
  const resumo =
    campaigns.find((c) => c.resumo_executivo)?.resumo_executivo ||
    "Sem análise disponível.";

  const adsComCriativo = ads.filter((a) => firstDriveLink(a.link_drive));

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-3">
        <div className={`h-px flex-1 bg-gradient-to-r ${isOwn ? "from-amber-400/50" : "from-primary/40"} to-transparent`} />
        <h2 className={`text-xl md:text-2xl font-semibold tracking-tight ${isOwn ? "text-amber-300" : "neon-text-white-glow"}`}>
          {concorrente}
        </h2>
        <div className={`h-px flex-1 bg-gradient-to-l ${isOwn ? "from-amber-400/50" : "from-primary/40"} to-transparent`} />
      </header>

      {/* Análise IA */}
      <div className={`glass-card rounded-xl p-4 border ${isOwn ? "border-amber-400/25" : "border-primary/20"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className={`h-4 w-4 ${isOwn ? "text-amber-400" : "text-neon-purple"}`} />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {isOwn ? "Nossa análise de campanha" : "Análise da IA"}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {resumo}
        </p>
      </div>

      {/* Tabela de campanhas */}
      {campaigns.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden border border-primary/15">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-primary/5 text-muted-foreground uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="text-left px-3 py-2">Tipo</th>
                  <th className="text-left px-3 py-2">Produto / Oferta</th>
                  <th className="text-left px-3 py-2">CTA</th>
                  <th className="text-left px-3 py-2">Tom</th>
                  <th className="text-right px-3 py-2">Anúncios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10">
                {campaigns.map((c, i) => (
                  <tr key={i} className="hover:bg-primary/5">
                    <td className="px-3 py-2 whitespace-nowrap text-neon-cyan">
                      {c.tipo_campanha}
                    </td>
                    <td className="px-3 py-2 max-w-[320px]">{c.produto_oferta}</td>
                    <td className="px-3 py-2 max-w-[220px] text-muted-foreground">
                      {c.cta}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] text-muted-foreground">
                      {c.tom}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-neon-purple font-medium">
                      {c.nr_anuncios}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Galeria de criativos */}
      {adsComCriativo.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Criativos ({adsComCriativo.length})
          </div>
          <DragCarousel>
            {adsComCriativo.map((ad, i) => (
              <div key={i} className="snap-start shrink-0">
                <IntelCreativeCard ad={ad} />
              </div>
            ))}
          </DragCarousel>
        </div>
      )}
    </section>
  );
}
