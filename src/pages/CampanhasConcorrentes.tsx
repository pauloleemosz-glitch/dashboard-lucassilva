import { motion } from "framer-motion";
import { IntelDashboard } from "@/components/Competitors/IntelDashboard";
import { TopNav } from "@/components/TopNav";
import logo from "@/assets/logo.svg";

export default function CampanhasConcorrentes() {
  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5 relative">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight gradient-text-anim">
            META // CAMPANHAS DOS CONCORRENTES
          </h1>
        </div>
        <motion.img
          src={logo}
          alt="LS Certificações"
          className="h-10 md:h-12 w-auto float-soft glow-breathe"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </motion.header>

      <TopNav />

      <IntelDashboard />
    </div>
  );
}
