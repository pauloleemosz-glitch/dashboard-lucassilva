import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilters } from "@/context/FilterContext";
import { cn } from "@/lib/utils";

interface Props {
  cursos: string[];
  lastUpdated?: Date | null;
  onRefresh: () => void;
  isFetching: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
}

export function GlobalFilters({ cursos, lastUpdated, onRefresh, isFetching, minDate, maxDate }: Props) {
  const { dateRange, setDateRange, curso, setCurso, modo, setModo } = useFilters();

  const today = maxDate ? endOfDay(maxDate) : endOfDay(new Date());
  const todayStart = maxDate ? startOfDay(maxDate) : startOfDay(new Date());

  const presets: { label: string; range: () => DateRange }[] = [
    { label: "Hoje", range: () => ({ from: todayStart, to: today }) },
    { label: "Ontem", range: () => ({ from: startOfDay(subDays(todayStart, 1)), to: endOfDay(subDays(todayStart, 1)) }) },
    { label: "Últimos 7 dias", range: () => ({ from: startOfDay(subDays(todayStart, 6)), to: today }) },
    { label: "Últimos 14 dias", range: () => ({ from: startOfDay(subDays(todayStart, 13)), to: today }) },
    { label: "Últimos 30 dias", range: () => ({ from: startOfDay(subDays(todayStart, 29)), to: today }) },
    { label: "Este mês", range: () => ({ from: startOfMonth(todayStart), to: today }) },
    { label: "Mês passado", range: () => ({ from: startOfMonth(subMonths(todayStart, 1)), to: endOfMonth(subMonths(todayStart, 1)) }) },
    { label: "Todo o período", range: () => ({ from: minDate ?? startOfDay(subDays(todayStart, 365)), to: today }) },
  ];

  return (
    <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary/30 text-sm",
              "hover:border-neon-cyan hover:bg-primary/5 transition-colors",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4 text-neon-cyan" />
            {dateRange?.from ? (
              dateRange.to ? (
                <span>
                  {format(dateRange.from, "d MMM yyyy", { locale: ptBR })} – {format(dateRange.to, "d MMM yyyy", { locale: ptBR })}
                </span>
              ) : (
                format(dateRange.from, "d MMM yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass-card border-primary/30" align="start">
          <div className="flex">
            <div className="flex flex-col gap-1 p-2 border-r border-primary/20 min-w-[150px]">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1">Atalhos</span>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDateRange(p.range())}
                  className="text-left text-xs px-2 py-1.5 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors text-muted-foreground"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(r) => setDateRange(r as DateRange | undefined)}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
          <div className="p-2 border-t border-primary/20">
            <button onClick={() => setDateRange(undefined)} className="text-xs text-muted-foreground hover:text-neon-cyan w-full text-center py-1">
              Limpar
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Curso */}
      <Select value={curso} onValueChange={setCurso}>
        <SelectTrigger className="w-[240px] border-primary/30 hover:border-neon-cyan">
          <SelectValue placeholder="Curso / Produto" />
        </SelectTrigger>
        <SelectContent className="glass-card border-primary/30">
          <SelectItem value="all">Todos os cursos</SelectItem>
          {cursos.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Toggle Perpétuo / Lead / Geral */}
      <div className="inline-flex items-center rounded-md border border-primary/30 p-0.5">
        {(["perpetuo", "lead", "geral"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-all capitalize",
              modo === m
                ? "bg-primary/20 text-neon-cyan"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={modo === m ? { boxShadow: "0 0 12px hsl(var(--neon-cyan) / 0.4)" } : undefined}
          >
            {m === "perpetuo" ? "Perpétuo" : m === "lead" ? "Lead" : "Geral"}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {lastUpdated && (
          <span className="text-[11px] text-muted-foreground">
            Última atualização: {format(lastUpdated, "HH:mm:ss")}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isFetching}
          className="p-2 rounded-md border border-primary/30 hover:border-neon-cyan hover:bg-primary/5 transition-colors disabled:opacity-50"
          title="Atualizar agora"
        >
          <RefreshCw className={cn("h-4 w-4 text-neon-cyan", isFetching && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
