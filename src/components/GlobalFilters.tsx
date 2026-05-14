import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RefreshCw, Check, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFilters } from "@/context/FilterContext";
import { cn } from "@/lib/utils";

interface Props {
  cursos: string[];
  angulos?: string[];
  mecanismos?: string[];
  lastUpdated?: Date | null;
  onRefresh: () => void;
  isFetching: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
}

export function GlobalFilters({ cursos: cursosDisponiveis, angulos = [], mecanismos = [], lastUpdated, onRefresh, isFetching, minDate, maxDate }: Props) {
  const { dateRange, setDateRange, cursos: cursosSelecionados, setCursos, modo, setModo, angulo, setAngulo, mecanismo, setMecanismo } = useFilters();

  const allSelected = cursosSelecionados.length === 0;
  const toggleCurso = (c: string) => {
    if (cursosSelecionados.includes(c)) {
      setCursos(cursosSelecionados.filter((x) => x !== c));
    } else {
      setCursos([...cursosSelecionados, c]);
    }
  };
  const cursoLabel = allSelected
    ? "Todos os cursos"
    : cursosSelecionados.length === 1
      ? cursosSelecionados[0]
      : `${cursosSelecionados.length} cursos selecionados`;

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
      <Popover modal={false}>
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

      {/* Curso (multi-seleção) */}
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-between gap-2 w-[240px] px-3 py-2 rounded-md border border-primary/30 text-sm",
              "hover:border-neon-cyan hover:bg-primary/5 transition-colors",
            )}
          >
            <span className={cn("truncate", allSelected && "text-muted-foreground")}>{cursoLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-1 glass-card border-primary/30" align="start">
          <button
            onClick={() => setCursos([])}
            className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
          >
            <span className="w-4 h-4 inline-flex items-center justify-center">
              {allSelected && <Check className="h-3.5 w-3.5 text-neon-cyan" />}
            </span>
            Todos os cursos
          </button>
          <div className="max-h-[280px] overflow-y-auto">
            {cursosDisponiveis.map((c) => {
              const checked = cursosSelecionados.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCurso(c)}
                  className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
                >
                  <span className={cn(
                    "w-4 h-4 inline-flex items-center justify-center rounded border",
                    checked ? "border-neon-cyan bg-primary/20" : "border-primary/30",
                  )}>
                    {checked && <Check className="h-3 w-3 text-neon-cyan" />}
                  </span>
                  <span className="truncate">{c}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Ângulo */}
      {angulos.length > 0 && (
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center justify-between gap-2 w-[170px] px-3 py-2 rounded-md border text-sm transition-colors",
                angulo !== "all"
                  ? "border-neon-cyan/60 bg-primary/10 text-neon-cyan"
                  : "border-primary/30 hover:border-neon-cyan hover:bg-primary/5 text-muted-foreground",
              )}
            >
              <span className="truncate capitalize">{angulo === "all" ? "Ângulo" : angulo}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1 glass-card border-primary/30" align="start">
            <button
              onClick={() => setAngulo("all")}
              className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
            >
              <span className="w-4 h-4 inline-flex items-center justify-center">
                {angulo === "all" && <Check className="h-3.5 w-3.5 text-neon-cyan" />}
              </span>
              Todos os ângulos
            </button>
            {angulos.map((a) => (
              <button
                key={a}
                onClick={() => setAngulo(a)}
                className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2 capitalize"
              >
                <span className="w-4 h-4 inline-flex items-center justify-center">
                  {angulo === a && <Check className="h-3 w-3 text-neon-cyan" />}
                </span>
                {a}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Mecanismo */}
      {mecanismos.length > 0 && (
        <Popover modal={false}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center justify-between gap-2 w-[170px] px-3 py-2 rounded-md border text-sm transition-colors",
                mecanismo !== "all"
                  ? "border-neon-cyan/60 bg-primary/10 text-neon-cyan"
                  : "border-primary/30 hover:border-neon-cyan hover:bg-primary/5 text-muted-foreground",
              )}
            >
              <span className="truncate capitalize">{mecanismo === "all" ? "Mecanismo" : mecanismo}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1 glass-card border-primary/30" align="start">
            <button
              onClick={() => setMecanismo("all")}
              className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
            >
              <span className="w-4 h-4 inline-flex items-center justify-center">
                {mecanismo === "all" && <Check className="h-3.5 w-3.5 text-neon-cyan" />}
              </span>
              Todos os mecanismos
            </button>
            {mecanismos.map((m) => (
              <button
                key={m}
                onClick={() => setMecanismo(m)}
                className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2 capitalize"
              >
                <span className="w-4 h-4 inline-flex items-center justify-center">
                  {mecanismo === m && <Check className="h-3 w-3 text-neon-cyan" />}
                </span>
                {m}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

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
