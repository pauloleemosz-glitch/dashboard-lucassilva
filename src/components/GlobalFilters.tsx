import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RefreshCw, Check, ChevronDown, ChevronRight, Minus } from "lucide-react";

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
  const { dateRange, setDateRange, cursos: cursosSelecionados, setCursos, modo, setModo, plataforma, setPlataforma, angulosSel, setAngulosSel, mecanismosSel, setMecanismosSel } = useFilters();

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

  // Campanhas de teste seguem a convenção "PRODUTO: [<curso> - Teste <dd/mm>]".
  // Aqui elas viram uma sublista dentro do curso principal em vez de itens soltos.
  const grupos = useMemo(() => {
    const re = /^(.+?)\s*[-–—]\s*Teste\b\s*(.*)$/i;
    const mapa = new Map<string, { base: string; baseDisponivel: boolean; testes: { valor: string; label: string }[] }>();
    const garantir = (base: string) => {
      let g = mapa.get(base);
      if (!g) {
        g = { base, baseDisponivel: false, testes: [] };
        mapa.set(base, g);
      }
      return g;
    };
    for (const c of cursosDisponiveis) {
      const m = c.match(re);
      if (m) {
        const sufixo = m[2].trim();
        garantir(m[1].trim()).testes.push({ valor: c, label: sufixo ? `Teste ${sufixo}` : "Teste" });
      } else {
        garantir(c).baseDisponivel = true;
      }
    }
    return Array.from(mapa.values())
      .map((g) => ({ ...g, testes: [...g.testes].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")) }))
      .sort((a, b) => a.base.localeCompare(b.base, "pt-BR"));
  }, [cursosDisponiveis]);

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  // Marcar o curso principal liga/desliga o curso E todos os testes dele de uma vez
  // (Paulo, 03/09). Os testes continuam podendo ser marcados um a um na sublista.
  // Quando o curso principal não existe no período, o grupo é só os testes.
  const toggleGrupo = (g: (typeof grupos)[number]) => {
    const valores = g.baseDisponivel ? [g.base, ...g.testes.map((t) => t.valor)] : g.testes.map((t) => t.valor);
    const ligar = g.baseDisponivel
      ? !cursosSelecionados.includes(g.base)
      : !valores.every((v) => cursosSelecionados.includes(v));
    setCursos(
      ligar
        ? [...cursosSelecionados, ...valores.filter((v) => !cursosSelecionados.includes(v))]
        : cursosSelecionados.filter((c) => !valores.includes(c)),
    );
  };

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
      {/* Plataforma: Combinado / Meta / Google */}
      <div className="inline-flex items-center rounded-md border border-neon-cyan/40 p-0.5 bg-primary/5">
        {([
          { v: "combinado", label: "Combinado" },
          { v: "meta", label: "Meta" },
          { v: "google", label: "Google" },
        ] as const).map((p) => (
          <button
            key={p.v}
            onClick={() => setPlataforma(p.v)}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-all",
              plataforma === p.v ? "bg-primary/25 text-neon-cyan" : "text-muted-foreground hover:text-foreground",
            )}
            style={plataforma === p.v ? { boxShadow: "0 0 12px hsl(var(--neon-cyan) / 0.45)" } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

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
            {grupos.map((g) => {
              const testesMarcados = g.testes.filter((t) => cursosSelecionados.includes(t.valor)).length;
              const baseMarcada = g.baseDisponivel
                ? cursosSelecionados.includes(g.base)
                : testesMarcados === g.testes.length && g.testes.length > 0;
              const parcial = !baseMarcada && testesMarcados > 0;
              const aberto = expandidos[g.base] ?? testesMarcados > 0;

              return (
                <div key={g.base}>
                  <div className="w-full flex items-center rounded hover:bg-primary/10 transition-colors">
                    {g.testes.length > 0 ? (
                      <button
                        onClick={() => setExpandidos((e) => ({ ...e, [g.base]: !aberto }))}
                        aria-label={aberto ? `Recolher testes de ${g.base}` : `Expandir testes de ${g.base}`}
                        aria-expanded={aberto}
                        className="shrink-0 p-1 rounded text-muted-foreground hover:text-neon-cyan transition-colors"
                      >
                        {aberto ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    ) : (
                      <span className="shrink-0 w-[22px]" />
                    )}
                    <button
                      onClick={() => toggleGrupo(g)}
                      className="flex-1 min-w-0 text-left text-xs pr-2 py-2 hover:text-neon-cyan transition-colors flex items-center gap-2"
                    >
                      <span className={cn(
                        "w-4 h-4 shrink-0 inline-flex items-center justify-center rounded border",
                        baseMarcada || parcial ? "border-neon-cyan bg-primary/20" : "border-primary/30",
                      )}>
                        {baseMarcada && <Check className="h-3 w-3 text-neon-cyan" />}
                        {parcial && <Minus className="h-3 w-3 text-neon-cyan" />}
                      </span>
                      <span className="truncate">{g.base}</span>
                      {g.testes.length > 0 && (
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                          {testesMarcados > 0 ? `${testesMarcados}/${g.testes.length}` : g.testes.length}
                          {" "}{g.testes.length === 1 ? "teste" : "testes"}
                        </span>
                      )}
                    </button>
                  </div>

                  {aberto && g.testes.map((t) => {
                    const checked = cursosSelecionados.includes(t.valor);
                    return (
                      <button
                        key={t.valor}
                        onClick={() => toggleCurso(t.valor)}
                        className="w-full text-left text-xs pl-8 pr-2 py-1.5 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
                      >
                        <span className={cn(
                          "w-4 h-4 shrink-0 inline-flex items-center justify-center rounded border",
                          checked ? "border-neon-cyan bg-primary/20" : "border-primary/30",
                        )}>
                          {checked && <Check className="h-3 w-3 text-neon-cyan" />}
                        </span>
                        <span className="truncate text-muted-foreground">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Ângulo (multi-seleção) */}
      {angulos.length > 0 && plataforma !== "google" && (
        <Popover modal={false}>
          <PopoverTrigger asChild>
            {(() => {
              const allAng = angulosSel.length === 0;
              const anguloLabel = allAng
                ? "Ângulo"
                : angulosSel.length === 1
                  ? angulosSel[0]
                  : `${angulosSel.length} ângulos`;
              return (
                <button
                  className={cn(
                    "inline-flex items-center justify-between gap-2 w-[170px] px-3 py-2 rounded-md border text-sm transition-colors",
                    !allAng
                      ? "border-neon-cyan/60 bg-primary/10 text-neon-cyan"
                      : "border-primary/30 hover:border-neon-cyan hover:bg-primary/5 text-muted-foreground",
                  )}
                >
                  <span className="truncate capitalize">{anguloLabel}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
              );
            })()}
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1 glass-card border-primary/30" align="start">
            <button
              onClick={() => setAngulosSel([])}
              className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
            >
              <span className="w-4 h-4 inline-flex items-center justify-center">
                {angulosSel.length === 0 && <Check className="h-3.5 w-3.5 text-neon-cyan" />}
              </span>
              Todos os ângulos
            </button>
            <div className="max-h-[280px] overflow-y-auto">
              {angulos.map((a) => {
                const checked = angulosSel.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() =>
                      setAngulosSel(checked ? angulosSel.filter((x) => x !== a) : [...angulosSel, a])
                    }
                    className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2 capitalize"
                  >
                    <span className={cn(
                      "w-4 h-4 inline-flex items-center justify-center rounded border",
                      checked ? "border-neon-cyan bg-primary/20" : "border-primary/30",
                    )}>
                      {checked && <Check className="h-3 w-3 text-neon-cyan" />}
                    </span>
                    {a}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Mecanismo (multi-seleção) */}
      {mecanismos.length > 0 && plataforma !== "google" && (
        <Popover modal={false}>
          <PopoverTrigger asChild>
            {(() => {
              const allMec = mecanismosSel.length === 0;
              const mecanismoLabel = allMec
                ? "Mecanismo"
                : mecanismosSel.length === 1
                  ? mecanismosSel[0]
                  : `${mecanismosSel.length} mecanismos`;
              return (
                <button
                  className={cn(
                    "inline-flex items-center justify-between gap-2 w-[170px] px-3 py-2 rounded-md border text-sm transition-colors",
                    !allMec
                      ? "border-neon-cyan/60 bg-primary/10 text-neon-cyan"
                      : "border-primary/30 hover:border-neon-cyan hover:bg-primary/5 text-muted-foreground",
                  )}
                >
                  <span className="truncate capitalize">{mecanismoLabel}</span>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
              );
            })()}
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-1 glass-card border-primary/30" align="start">
            <button
              onClick={() => setMecanismosSel([])}
              className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2"
            >
              <span className="w-4 h-4 inline-flex items-center justify-center">
                {mecanismosSel.length === 0 && <Check className="h-3.5 w-3.5 text-neon-cyan" />}
              </span>
              Todos os mecanismos
            </button>
            <div className="max-h-[280px] overflow-y-auto">
              {mecanismos.map((m) => {
                const checked = mecanismosSel.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() =>
                      setMecanismosSel(checked ? mecanismosSel.filter((x) => x !== m) : [...mecanismosSel, m])
                    }
                    className="w-full text-left text-xs px-2 py-2 rounded hover:bg-primary/10 hover:text-neon-cyan transition-colors flex items-center gap-2 capitalize"
                  >
                    <span className={cn(
                      "w-4 h-4 inline-flex items-center justify-center rounded border",
                      checked ? "border-neon-cyan bg-primary/20" : "border-primary/30",
                    )}>
                      {checked && <Check className="h-3 w-3 text-neon-cyan" />}
                    </span>
                    {m}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Toggle Perpétuo / Lead / Geral (somente Meta) */}
      {plataforma !== "google" && (
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
      )}

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
