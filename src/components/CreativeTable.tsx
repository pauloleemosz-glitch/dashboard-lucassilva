import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";
import { AdRow } from "@/hooks/useSheetData";
import { ctr as ctrFn, hookRate as hookRateFn, cpm as cpmFn, cpaPerpetuo, cpaLancamento } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct, extractDriveId } from "@/utils/parsers";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface AggRow {
  adName: string;
  curso: string;
  link?: string;
  driveId?: string | null;
  leads: number;
  impressions: number;
  videoPlays3s: number;
  clicks: number;
  ctr: number | null;
  hookRate: number | null;
  cpm: number | null;
  videoPlays25: number;
  videoPlays95: number;
  spend: number;
  valorConversao: number;
  compras: number;
  cpaCompra: number | null;
  cpaLead: number | null;
}

type SortKey = keyof Omit<AggRow, "link" | "driveId" | "curso">;

function aggregate(rows: AdRow[]): AggRow[] {
  const map = new Map<string, AggRow>();
  for (const r of rows) {
    const key = r.adName;
    const existing = map.get(key);
    if (!existing) {
      // Convention: ad name itself is used as the Drive file id
      const driveId = extractDriveId(r.link) || r.adName;
      map.set(key, {
        adName: r.adName,
        curso: r.curso || "—",
        link: r.link,
        driveId,
        leads: r.leads,
        impressions: r.impressions,
        videoPlays3s: r.videoPlays3s,
        clicks: r.clicks,
        ctr: null,
        hookRate: null,
        cpm: null,
        videoPlays25: r.videoPlays25,
        videoPlays95: r.videoPlays95,
        spend: r.spend,
        valorConversao: r.valorCompra,
      });
    } else {
      existing.leads += r.leads;
      existing.impressions += r.impressions;
      existing.videoPlays3s += r.videoPlays3s;
      existing.clicks += r.clicks;
      existing.videoPlays25 += r.videoPlays25;
      existing.videoPlays95 += r.videoPlays95;
      existing.spend += r.spend;
      existing.valorConversao += r.valorCompra;
    }
  }
  for (const v of map.values()) {
    v.ctr = ctrFn(v.clicks, v.impressions);
    v.hookRate = hookRateFn(v.videoPlays3s, v.impressions);
    v.cpm = cpmFn(v.spend, v.impressions);
  }
  return Array.from(map.values());
}

export function CreativeTable({ rows }: { rows: AdRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const data = useMemo(() => aggregate(rows), [rows]);
  const maxValor = useMemo(() => Math.max(...data.map((d) => d.valorConversao), 0), [data]);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aNum = typeof av === "number" ? av : av === null ? -Infinity : 0;
      const bNum = typeof bv === "number" ? bv : bv === null ? -Infinity : 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
    return arr;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-neon-cyan" /> : <ArrowDown className="h-3 w-3 text-neon-cyan" />;
  };

  const cols: { key: SortKey; label: string; format: (v: any) => string }[] = [
    { key: "leads", label: "Leads", format: (v) => formatNumber(v) },
    { key: "impressions", label: "Impressões", format: (v) => formatNumber(v) },
    { key: "videoPlays3s", label: "Reproduções", format: (v) => formatNumber(v) },
    { key: "clicks", label: "Cliques", format: (v) => formatNumber(v) },
    { key: "ctr", label: "CTR", format: (v) => formatPct(v) },
    { key: "hookRate", label: "Hook Rate", format: (v) => formatPct(v) },
    { key: "cpm", label: "CPM", format: (v) => formatBRL(v) },
    { key: "videoPlays25", label: "Reprod. 25%", format: (v) => formatNumber(v) },
    { key: "videoPlays95", label: "Reprod. 100%", format: (v) => formatNumber(v) },
    { key: "spend", label: "Investido", format: (v) => formatBRL(v) },
    { key: "valorConversao", label: "Valor Conversão", format: (v) => formatBRL(v) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Criativos</h3>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neon-cyan/80 lg:hidden">
            <ChevronsRight className="h-3 w-3 animate-pulse" />
            Deslize para ver mais
          </span>
          <span className="text-xs text-muted-foreground">{sorted.length} anúncios</span>
        </div>
      </div>

      <div className="relative">
        <div className="lg:hidden absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10 bg-gradient-to-l from-background to-transparent" />
        <div className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <motion.div
            animate={{ x: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-full bg-neon-cyan/20 border border-neon-cyan/50 p-1.5 backdrop-blur-sm"
            style={{ boxShadow: "0 0 12px hsl(var(--neon-cyan) / 0.5)" }}
          >
            <ChevronsRight className="h-3.5 w-3.5 text-neon-cyan" />
          </motion.div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left py-2 px-2 text-muted-foreground font-light">#</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-light min-w-[200px]">Anúncio</th>
              {cols.map((c) => (
                <th key={c.key} className="text-right py-2 px-2 text-muted-foreground font-light whitespace-nowrap">
                  <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-neon-cyan transition-colors">
                    {c.label}
                    <SortIcon k={c.key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={cols.length + 2} className="text-center text-muted-foreground py-8">
                  Nenhum criativo encontrado
                </td>
              </tr>
            )}
            {pageData.map((r, idx) => {
              const isTop = r.valorConversao > 0 && r.valorConversao === maxValor;
              const driveId = r.driveId;
              const driveHref = driveId ? `https://drive.google.com/file/d/${driveId}/view` : r.link;
              return (
                <tr
                  key={r.adName + idx}
                  className={cn(
                    "border-b border-primary/10 hover:bg-primary/5 transition-colors",
                    isTop && "neon-border-pulse",
                  )}
                >
                  <td className="py-2 px-2 text-muted-foreground">{page * PAGE_SIZE + idx + 1}</td>
                  <td className="py-2 px-2 max-w-[260px]">
                    <HoverCard openDelay={150} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        {driveHref ? (
                          <a
                            href={driveHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 max-w-full truncate text-foreground hover:text-neon-cyan transition-colors"
                            title={r.adName}
                          >
                            <span className="truncate">{r.adName}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <span className="truncate text-foreground" title={r.adName}>{r.adName}</span>
                        )}
                      </HoverCardTrigger>
                      {driveId && (
                        <HoverCardContent
                          side="right"
                          align="start"
                          className="p-2 w-[280px] bg-[hsl(220_60%_6%/0.95)] border border-neon-cyan/40 backdrop-blur-md"
                          style={{ boxShadow: "0 0 24px hsl(var(--neon-cyan) / 0.25)" }}
                        >
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 truncate">
                            {r.adName}
                          </div>
                          <div className="rounded overflow-hidden border border-primary/30 bg-muted/40 aspect-video flex items-center justify-center">
                            <img
                              src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w400`}
                              alt={r.adName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = "none";
                                const fallback = img.parentElement?.querySelector("[data-fallback]") as HTMLElement | null;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div
                              data-fallback
                              className="hidden w-full h-full items-center justify-center text-[10px] text-muted-foreground"
                            >
                              Prévia indisponível
                            </div>
                          </div>
                          <a
                            href={driveHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] text-neon-cyan hover:underline"
                          >
                            Abrir no Drive <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </HoverCardContent>
                      )}
                    </HoverCard>
                    <div className="truncate text-[10px] text-neon-cyan/70 uppercase tracking-wider">{r.curso}</div>
                  </td>
                  {cols.map((c) => {
                    const v = r[c.key];
                    return (
                      <td key={c.key} className="text-right py-2 px-2 tabular-nums whitespace-nowrap">
                        {v === null || v === undefined ? <span className="text-muted-foreground">—</span> : c.format(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-primary/30 text-neon-cyan hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-primary/30 text-neon-cyan hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
