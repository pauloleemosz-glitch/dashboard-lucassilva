import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { DateRange } from "react-day-picker";

export type Modo = "perpetuo" | "lead" | "geral";

interface FilterCtx {
  dateRange: DateRange | undefined;
  setDateRange: (r: DateRange | undefined) => void;
  cursos: string[];
  setCursos: (c: string[]) => void;
  /** @deprecated compat: retorna primeiro curso ou "all" */
  curso: string;
  setCurso: (c: string) => void;
  modo: Modo;
  setModo: (m: Modo) => void;
  angulosSel: string[];
  setAngulosSel: (a: string[]) => void;
  mecanismosSel: string[];
  setMecanismosSel: (m: string[]) => void;
}

const FilterContext = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [cursos, setCursos] = useState<string[]>([]);
  const [modo, setModo] = useState<Modo>("perpetuo");
  const [angulosSel, setAngulosSel] = useState<string[]>([]);
  const [mecanismosSel, setMecanismosSel] = useState<string[]>([]);

  const value = useMemo(
    () => ({
      dateRange,
      setDateRange,
      cursos,
      setCursos,
      curso: cursos.length === 1 ? cursos[0] : "all",
      setCurso: (c: string) => setCursos(c === "all" ? [] : [c]),
      modo,
      setModo,
      angulosSel,
      setAngulosSel,
      mecanismosSel,
      setMecanismosSel,
    }),
    [dateRange, cursos, modo, angulosSel, mecanismosSel],
  );
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
