import { ExternalLink, Calendar, Activity, XCircle, ImageIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CompetitorAd } from "@/hooks/useCompetitorsData";
import { useAdPreview } from "@/hooks/useAdPreview";
import { cn } from "@/lib/utils";

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "FB",
  INSTAGRAM: "IG",
  MESSENGER: "Msg",
  THREADS: "Threads",
  AUDIENCE_NETWORK: "Audience",
  WHATSAPP: "WhatsApp",
};

interface Props {
  ad: CompetitorAd;
}

export function CompetitorAdCard({ ad }: Props) {
  const isActive = ad.status === "ativo";
  const titulo = ad.titulo && !ad.titulo.startsWith("{{") ? ad.titulo : "(sem título)";
  const texto = ad.texto && !ad.texto.startsWith("{{") ? ad.texto : "";
  const { src, loading, error, load } = useAdPreview(ad.adId, ad.link);

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 flex flex-col gap-3 transition-all group",
        isActive
          ? "border-neon-cyan/40 hover:border-neon-cyan/80 hover:shadow-[0_0_24px_hsl(var(--neon-cyan)/0.25)]"
          : "border-neon-orange/30 hover:border-neon-orange/60 opacity-90",
      )}
    >
      {/* Status header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full",
            isActive
              ? "text-neon-cyan border border-neon-cyan/40 bg-neon-cyan/5"
              : "text-neon-orange border border-neon-orange/40 bg-neon-orange/5",
          )}
        >
          {isActive ? (
            <>
              <Activity className="h-2.5 w-2.5 animate-pulse" />
              Ativo há {ad.diasAtivo}d
            </>
          ) : (
            <>
              <XCircle className="h-2.5 w-2.5" />
              Desativado · durou {ad.diasAtivo}d
            </>
          )}
        </div>
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-neon-cyan transition-colors"
          title="Abrir na Biblioteca de Anúncios"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Preview */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-primary/15 bg-background/40">
        {src ? (
          <img
            src={src}
            alt={`Preview do anúncio ${titulo}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[10px] uppercase tracking-widest">Gerando preview…</span>
              </>
            ) : error ? (
              <>
                <ImageIcon className="h-5 w-5 text-neon-orange" />
                <span className="text-[10px] text-neon-orange/90 px-3 text-center">{error}</span>
                <span className="text-[9px] uppercase tracking-widest">Tentar novamente</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-widest">Ver preview</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Title + text */}
      <div className="flex-1 min-h-0">
        <h4 className="text-sm text-foreground line-clamp-2 mb-1.5 leading-snug">{titulo}</h4>
        {texto && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{texto}</p>
        )}
      </div>

      {/* Footer: dates + platforms */}
      <div className="flex flex-col gap-2 pt-2 border-t border-primary/10">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Calendar className="h-2.5 w-2.5 shrink-0 text-neon-cyan/70" />
          {ad.inicioAnuncio ? (
            <span>
              Início: {format(ad.inicioAnuncio, "dd MMM yyyy", { locale: ptBR })}
            </span>
          ) : (
            <span>Início desconhecido</span>
          )}
          {!isActive && ad.lastSeen && (
            <span className="ml-auto text-neon-orange/80">
              Off: {format(ad.lastSeen, "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
        {ad.plataformas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.plataformas.map((p) => (
              <span
                key={p}
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20 text-muted-foreground/80"
              >
                {PLATFORM_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
