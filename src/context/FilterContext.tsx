import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { DateRange } from "react-day-picker";

export type Modo = "perpetuo" | "lead" | "geral";

interface FilterCtx {
  dateRange: DateRange | undefined;
  setDateRange: (r: DateRange | undefined) => void;
  curso: string;
  setCurso: (c: string) => void;
  modo: Modo;
  setModo: (m: Modo) => void;
}

const FilterContext = createContext<FilterCtx | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [curso, setCurso] = useState<string>("all");
  const [modo, setModo] = useState<Modo>("perpetuo");

  const value = useMemo(
    () => ({ dateRange, setDateRange, curso, setCurso, modo, setModo }),
    [dateRange, curso, modo],
  );
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
