import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ImageOff, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { AdRow } from "@/hooks/useSheetData";
import { ctr as ctrFn, hookRate as hookRateFn, cpm as cpmFn } from "@/utils/metrics";
import { formatBRL, formatNumber, formatPct, extractDriveId } from "@/utils/parsers";
import { cn } from "@/lib/utils";

interface AggRow {
  adName: string;
  campaign: string;
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
}

type SortKey = keyof Omit<AggRow, "link" | "driveId" | "campaign">;

function aggregate(rows: AdRow[]): AggRow[] {
  const map = new Map<string, AggRow>();
  for (const r of rows) {
    const key = r.adName;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        adName: r.adName,
        campaign: r.campaign,
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Criativos</h3>
        <span className="text-xs text-muted-foreground">{sorted.length} anúncios</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left py-2 px-2 text-muted-foreground font-light">#</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-light">Thumb</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-light min-w-[180px]">Anúncio</th>
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
                <td colSpan={cols.length + 3} className="text-center text-muted-foreground py-8">
                  Nenhum criativo encontrado
                </td>
              </tr>
            )}
            {pageData.map((r, idx) => {
              const isTop = r.valorConversao > 0 && r.valorConversao === maxValor;
              const driveId = r.driveId || extractDriveId(r.link);
              return (
                <tr
                  key={r.adName + idx}
                  className={cn(
                    "border-b border-primary/10 hover:bg-primary/5 transition-colors",
                    isTop && "neon-border-pulse",
                  )}
                >
                  <td className="py-2 px-2 text-muted-foreground">{page * PAGE_SIZE + idx + 1}</td>
                  <td className="py-2 px-2">
                    {driveId ? (
                      <img
                        src={`https://drive.google.com/thumbnail?id=${driveId}&sz=w80`}
                        alt=""
                        className="w-10 h-10 object-cover rounded border border-primary/30"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded border border-primary/20 bg-muted/40 flex items-center justify-center">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 max-w-[220px]">
                    <a
                      href={`https://drive.google.com/file/d/${encodeURIComponent(r.adName)}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 truncate text-foreground hover:text-neon-cyan transition-colors"
                      title={r.adName}
                    >
                      <span className="truncate">{r.adName}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                    </a>
                    <div className="truncate text-[10px] text-muted-foreground">{r.campaign}</div>
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
