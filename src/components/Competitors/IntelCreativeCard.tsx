import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { extractDriveId, firstDriveLink, CompetitorAdRow } from "@/hooks/useIntelData";

export function IntelCreativeCard({ ad }: { ad: CompetitorAdRow }) {
  const link = firstDriveLink(ad.link_drive);
  const id = link ? extractDriveId(link) : null;
  if (!id) return null;

  const inicio = ad.inicio ? new Date(ad.inicio.replace(" ", "T")) : null;
  const plataformas = ad.plataformas
    ? ad.plataformas.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="shrink-0 w-[240px] glass-card rounded-xl overflow-hidden border border-primary/15 hover:border-primary/40 transition-colors flex flex-col">
      <div className="aspect-square bg-black relative overflow-hidden">
        <iframe
          src={`https://drive.google.com/file/d/${id}/preview`}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay"
          loading="lazy"
          title={`creative-${id}`}
        />
      </div>
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {inicio ? format(inicio, "dd MMM yyyy", { locale: ptBR }) : "—"}
        </div>
        <div className="flex flex-wrap gap-1">
          {plataformas.map((p) => (
            <span
              key={p}
              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-neon-cyan border border-primary/20"
            >
              {p}
            </span>
          ))}
        </div>
        {ad.link_adlib ? (
          <a
            href={ad.link_adlib}
            target="_blank"
            rel="noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1.5 rounded border border-primary/30 text-neon-cyan hover:bg-primary/10 transition-colors"
          >
            Ad Library <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <div className="mt-auto h-[26px]" />
        )}
      </div>
    </div>
  );
}
