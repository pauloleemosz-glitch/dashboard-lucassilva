import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import AnunciosConcorrentes from "./pages/AnunciosConcorrentes.tsx";
import CampanhasConcorrentes from "./pages/CampanhasConcorrentes.tsx";
import ProducaoCriativos from "./pages/ProducaoCriativos.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/anuncios-concorrentes" element={<AnunciosConcorrentes />} />
          <Route path="/campanhas-concorrentes" element={<CampanhasConcorrentes />} />
          <Route path="/producao-criativos" element={<ProducaoCriativos />} />
          {/* Redirect legacy route */}
          <Route path="/concorrentes" element={<AnunciosConcorrentes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
