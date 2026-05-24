import { useMemo, useState, ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T & string;
  label: string;
  align?: "left" | "right";
  /** Largura mínima opcional (px) para a coluna. */
  minWidth?: number;
  /** Formata o valor numérico/string para exibição. */
  format?: (v: any, row: T) => string;
  /** Render customizado (ex.: hovercard de headlines). Tem prioridade sobre format. */
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  initialSortKey?: keyof T & string;
  pageSize?: number;
  delay?: number;
}

export function DataTable<T extends Record<string, any>>({
  title,
  columns,
  rows,
  initialSortKey,
  pageSize = 10,
  delay = 0,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string>(initialSortKey || columns[0]?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = typeof av === "number" ? av : -Infinity;
      const bn = typeof bv === "number" ? bv : -Infinity;
      return sortDir === "asc" ? an - bn : bn - an;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const toggleSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ k }: { k: string }) => {
    if (k !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-neon-cyan" />
    ) : (
      <ArrowDown className="h-3 w-3 text-neon-cyan" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground">{title}</h3>
        <div className="flex items-center gap-3">
          <span className="sm:inline-flex hidden items-center gap-1.5 text-[10px] uppercase tracking-widest text-neon-cyan/80 lg:hidden">
            <ChevronsRight className="h-3 w-3 animate-pulse" />
            Deslize para ver mais
          </span>
          <span className="text-xs text-muted-foreground">{sorted.length.toLocaleString("pt-BR")} linhas</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left py-2 px-2 text-muted-foreground font-light">#</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "py-2 px-2 text-muted-foreground font-light whitespace-nowrap",
                    c.align === "left" ? "text-left" : "text-right",
                  )}
                  style={c.minWidth ? { minWidth: c.minWidth } : undefined}
                >
                  <button
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-neon-cyan transition-colors",
                      c.align === "left" ? "" : "flex-row-reverse",
                    )}
                  >
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
                <td colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
            {pageData.map((r, idx) => (
              <tr key={idx} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                <td className="py-2 px-2 text-muted-foreground">{safePage * pageSize + idx + 1}</td>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "py-2 px-2 tabular-nums",
                      c.align === "left" ? "text-left" : "text-right whitespace-nowrap",
                    )}
                  >
                    {c.render
                      ? c.render(r)
                      : c.format
                        ? c.format(r[c.key], r)
                        : r[c.key] === null || r[c.key] === undefined || r[c.key] === ""
                          ? <span className="text-muted-foreground">—</span>
                          : String(r[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs">
          <span className="text-muted-foreground">
            Página {safePage + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1 rounded border border-primary/30 text-neon-cyan hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
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
