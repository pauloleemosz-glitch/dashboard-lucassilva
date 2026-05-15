import { NavLink } from "react-router-dom";
import { BarChart3, Eye, Megaphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PORTAL_CRIATIVOS_URL = "https://criativos.pages.professorlucassilva.com.br";
const PORTAL_CRIATIVOS_FALLBACK = "https://criativos-cxl.pages.dev";

export function TopNav() {
  const tabs = [
    { to: "/", label: "Dashboard", icon: BarChart3 },
    { to: "/anuncios-concorrentes", label: "Anúncios Concorrentes", icon: Eye },
    { to: "/campanhas-concorrentes", label: "Campanhas Concorrentes", icon: Megaphone },
  ];

  return (
    <nav className="flex items-center gap-2 p-1 rounded-xl glass-card w-fit flex-wrap">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm tracking-wider uppercase transition-all",
              isActive
                ? "bg-primary/15 text-neon-cyan border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent",
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}

      <a
        href={PORTAL_CRIATIVOS_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          // Se o domínio custom ainda não propagou, usa fallback do Pages
          if (e.currentTarget.href === PORTAL_CRIATIVOS_URL) {
            // navegação acontece naturalmente; fallback fica como referência manual
          }
        }}
        title="Portal de produção de criativos (sugestões via Claude)"
        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm tracking-wider uppercase transition-all bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 text-neon-cyan border border-fuchsia-400/40 hover:border-fuchsia-300/70 hover:shadow-[0_0_18px_hsl(280_85%_60%/0.35)]"
        data-fallback={PORTAL_CRIATIVOS_FALLBACK}
      >
        <Sparkles className="h-4 w-4" />
        Produção de Criativos
      </a>
    </nav>
  );
}
