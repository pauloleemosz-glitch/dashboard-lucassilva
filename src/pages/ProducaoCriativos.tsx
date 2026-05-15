import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Video, Copy, Check, RefreshCw, BookOpen, Lightbulb, Loader2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fetchBiblioteca,
  fetchSugestoes,
  fetchProdutosAtivos,
  gerarSugestoes,
  atualizarStatus,
  type ProdutoAtivo,
  type Sugestao,
  type Vencedor,
} from "@/lib/criativos-api";

const fmtBRL = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const fmtInt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("pt-BR").format(n);

type Tab = "sugestoes" | "biblioteca";
type FiltroStatus = "todos" | "novo" | "aprovado" | "produzido";
type FiltroFormato = "todos" | "imagem" | "video";

function CopyChip({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={copy}
      className={cn(
        "h-7 px-3 text-xs gap-1.5 uppercase tracking-wider transition-colors",
        copied && "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50",
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

function MetaTags({ s }: { s: Sugestao }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {s.produto && <Badge variant="outline" className="border-neon-cyan/40 text-neon-cyan">{s.produto}</Badge>}
      {s.angulo && <Badge variant="outline">Ângulo: {s.angulo}</Badge>}
      {s.mecanismo && <Badge variant="outline">Mec.: {s.mecanismo}</Badge>}
      {s.tom && <Badge variant="outline">Tom: {s.tom}</Badge>}
    </div>
  );
}

function StatusBar({ s, onStatus }: { s: Sugestao; onStatus: (id: string, st: Sugestao["status"]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-border/40">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">Status:</span>
      <Badge
        variant="outline"
        className={cn(
          "uppercase tracking-wider",
          s.status === "novo" && "border-neon-orange/50 text-neon-orange",
          s.status === "aprovado" && "border-neon-cyan/50 text-neon-cyan",
          s.status === "produzido" && "border-neon-gold/50 text-neon-gold",
          s.status === "descartado" && "border-destructive/50 text-destructive",
        )}
      >
        {s.status}
      </Badge>
      <div className="flex-1" />
      {s.status !== "aprovado" && (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatus(s.id, "aprovado")}>
          ✓ Aprovar
        </Button>
      )}
      {s.status !== "produzido" && (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatus(s.id, "produzido")}>
          🎬 Produzido
        </Button>
      )}
      {s.status !== "descartado" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onStatus(s.id, "descartado")}
        >
          ✕ Descartar
        </Button>
      )}
    </div>
  );
}

function CardImagem({ s, onStatus }: { s: Sugestao; onStatus: (id: string, st: Sugestao["status"]) => void }) {
  return (
    <Card className="p-5 space-y-4 glass-card">
      <div className="flex items-start gap-3">
        <ImageIcon className="h-5 w-5 text-neon-magenta mt-1 shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-foreground">{s.headline || "—"}</h3>
          <MetaTags s={s} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-neon-cyan font-medium">
            Freepik Prompt (EN)
          </div>
          <CopyChip text={s.freepik_prompt_en || ""} label="Copiar prompt" />
        </div>
        <div className="font-mono text-xs whitespace-pre-wrap rounded-lg border border-neon-cyan/30 bg-background/60 p-4 text-foreground/90">
          {s.freepik_prompt_en || "—"}
        </div>
      </div>

      {s.freepik_instrucoes_pt && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Instruções (PT)
            {s.freepik_ratio && <span className="text-neon-cyan ml-2">· Ratio: {s.freepik_ratio}</span>}
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{s.freepik_instrucoes_pt}</p>
        </div>
      )}

      {s.copy_principal && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Copy</div>
          <p className="text-sm text-foreground/80">{s.copy_principal}</p>
        </div>
      )}

      {s.promessa && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Promessa:</span> {s.promessa}
        </div>
      )}

      <StatusBar s={s} onStatus={onStatus} />
    </Card>
  );
}

function CardVideo({ s, onStatus }: { s: Sugestao; onStatus: (id: string, st: Sugestao["status"]) => void }) {
  const headlines: string[] = (() => {
    try {
      return s.video_headlines ? JSON.parse(s.video_headlines) : [];
    } catch {
      return [];
    }
  })();

  return (
    <Card className="p-5 space-y-4 glass-card">
      <div className="flex items-start gap-3">
        <Video className="h-5 w-5 text-neon-purple mt-1 shrink-0" />
        <div className="flex-1 space-y-2">
          <h3 className="font-medium text-foreground">{s.headline || "—"}</h3>
          <MetaTags s={s} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-neon-cyan font-medium">Roteiro</div>
          <CopyChip text={s.video_roteiro || ""} label="Copiar roteiro" />
        </div>
        <div className="font-mono text-xs whitespace-pre-wrap rounded-lg border border-neon-purple/30 bg-background/60 p-4 text-foreground/90">
          {s.video_roteiro || "—"}
        </div>
      </div>

      {headlines.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
            Headlines alternativas de capa
          </div>
          <ul className="space-y-1.5">
            {headlines.map((h, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-neon-cyan text-sm font-mono">{i + 1}.</span>
                <span className="text-sm text-foreground/90 flex-1">{h}</span>
                <CopyChip text={h} label="Copiar" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.video_instrucoes_pt && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
            Instruções de gravação (PT)
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{s.video_instrucoes_pt}</p>
        </div>
      )}

      {s.copy_principal && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">Copy</div>
          <p className="text-sm text-foreground/80">{s.copy_principal}</p>
        </div>
      )}

      <StatusBar s={s} onStatus={onStatus} />
    </Card>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}:</span>
      <div className="flex p-0.5 rounded-lg glass-card">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs uppercase tracking-wider transition-colors",
              value === o.value
                ? "bg-primary/15 text-neon-cyan border border-primary/40"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProdutoPicker({
  produtos,
  selecionado,
  onSelecionar,
}: {
  produtos: ProdutoAtivo[];
  selecionado: string | null;
  onSelecionar: (p: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
        Produto p/ gerar:
      </span>
      <div className="flex gap-1.5 flex-wrap items-center">
        <button
          onClick={() => onSelecionar(null)}
          title="Detectar automaticamente pelo produto com maior performance na biblioteca"
          className={cn(
            "px-3 py-1 rounded-md text-xs uppercase tracking-wider transition-colors border",
            selecionado === null
              ? "bg-primary/15 text-neon-cyan border-primary/40"
              : "text-muted-foreground border-border/40 hover:text-foreground",
          )}
        >
          🪄 Auto
        </button>
        {produtos.length === 0 && (
          <span className="text-[11px] text-muted-foreground italic">
            (carregando produtos ativos…)
          </span>
        )}
        {produtos.map((p) => (
          <button
            key={p.produto}
            onClick={() => onSelecionar(p.produto)}
            title={`R$ ${p.spend_recente.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })} nos últimos 7 dias · ${p.ads_rodando} ads · ${p.dias_ativo} dias`}
            className={cn(
              "px-3 py-1 rounded-md text-xs uppercase tracking-wider transition-colors border flex items-center gap-1.5",
              selecionado === p.produto
                ? "bg-primary/15 text-neon-cyan border-primary/40"
                : "text-muted-foreground border-border/40 hover:text-foreground",
            )}
          >
            {p.produto}
            <span className="text-[10px] opacity-60 normal-case">· {p.ads_rodando}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sugestoes({
  sugestoes,
  onStatus,
  produtosAtivos,
  produtoSelecionado,
  onSelecionarProduto,
}: {
  sugestoes: Sugestao[];
  onStatus: (id: string, st: Sugestao["status"]) => void;
  produtosAtivos: ProdutoAtivo[];
  produtoSelecionado: string | null;
  onSelecionarProduto: (p: string | null) => void;
}) {
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("novo");
  const [filtroFormato, setFiltroFormato] = useState<FiltroFormato>("todos");

  const filtradas = useMemo(
    () =>
      sugestoes.filter((s) => {
        if (filtroStatus !== "todos" && s.status !== filtroStatus) return false;
        if (filtroFormato !== "todos" && s.formato !== filtroFormato) return false;
        return true;
      }),
    [sugestoes, filtroStatus, filtroFormato],
  );

  if (sugestoes.length === 0) {
    return (
      <Card className="p-12 text-center glass-card">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-neon-cyan" />
        <h2 className="text-lg font-medium mb-2">Nenhuma sugestão ainda</h2>
        <p className="text-sm text-muted-foreground">
          Clique em <strong>Gerar novas sugestões</strong> no topo pra criar a primeira leva (5 imagens
          + 3 vídeos) baseada nos vencedores da biblioteca.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup
          label="Status"
          value={filtroStatus}
          onChange={(v) => setFiltroStatus(v as FiltroStatus)}
          options={[
            { value: "novo", label: "Novos" },
            { value: "aprovado", label: "Aprovados" },
            { value: "produzido", label: "Produzidos" },
            { value: "todos", label: "Todos" },
          ]}
        />
        <FilterGroup
          label="Formato"
          value={filtroFormato}
          onChange={(v) => setFiltroFormato(v as FiltroFormato)}
          options={[
            { value: "todos", label: "Todos" },
            { value: "imagem", label: "Imagem" },
            { value: "video", label: "Vídeo" },
          ]}
        />

        <ProdutoPicker
          produtos={produtosAtivos}
          selecionado={produtoSelecionado}
          onSelecionar={onSelecionarProduto}
        />

        <span className="ml-auto text-xs text-muted-foreground">
          {filtradas.length} de {sugestoes.length}
        </span>
      </div>

      <div className="grid gap-5">
        {filtradas.map((s) =>
          s.formato === "imagem" ? (
            <CardImagem key={s.id} s={s} onStatus={onStatus} />
          ) : (
            <CardVideo key={s.id} s={s} onStatus={onStatus} />
          ),
        )}
      </div>
    </div>
  );
}

function MetricChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-sm", highlight ? "text-neon-cyan font-semibold" : "text-foreground/90")}>
        {value}
      </div>
    </div>
  );
}

function Biblioteca({ vencedores }: { vencedores: Vencedor[] }) {
  const [produtoFiltro, setProdutoFiltro] = useState<string>("todos");
  const produtos = useMemo(() => {
    const set = new Set(vencedores.map((v) => v.produto).filter(Boolean));
    return ["todos", ...Array.from(set)];
  }, [vencedores]);
  const filtrados = useMemo(
    () => (produtoFiltro === "todos" ? vencedores : vencedores.filter((v) => v.produto === produtoFiltro)),
    [vencedores, produtoFiltro],
  );

  if (vencedores.length === 0) {
    return (
      <Card className="p-12 text-center glass-card">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-neon-purple" />
        <h2 className="text-lg font-medium mb-2">Biblioteca vazia</h2>
        <p className="text-sm text-muted-foreground">
          Rode <code className="text-neon-cyan">construir_biblioteca.py</code> pra popular com top performers.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Produto:</span>
        {produtos.map((p) => (
          <button
            key={p}
            onClick={() => setProdutoFiltro(p)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-colors border",
              produtoFiltro === p
                ? "bg-primary/15 text-neon-cyan border-primary/40"
                : "text-muted-foreground border-border/40 hover:text-foreground",
            )}
          >
            {p}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtrados.length} criativos</span>
      </div>

      <div className="grid gap-3">
        {filtrados.map((v) => (
          <Card key={v.id} className="p-4 glass-card">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-neon-purple shrink-0">
                {v.formato?.includes("video") || v.formato?.includes("talking") ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{v.headline || v.ad_name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge variant="outline" className="border-neon-cyan/40 text-neon-cyan text-[10px]">
                    {v.produto}
                  </Badge>
                  {v.formato && <Badge variant="outline" className="text-[10px]">{v.formato}</Badge>}
                  {v.angulo && <Badge variant="outline" className="text-[10px]">Ângulo: {v.angulo}</Badge>}
                  {v.mecanismo && <Badge variant="outline" className="text-[10px]">Mec.: {v.mecanismo}</Badge>}
                </div>
                {v.copy_principal && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{v.copy_principal}</p>
                )}
              </div>
              <div className="shrink-0 grid grid-cols-3 gap-x-5 gap-y-1">
                <MetricChip label="Score" value={fmtInt(v.score)} highlight />
                <MetricChip label="Compras" value={fmtInt(v.compras)} />
                <MetricChip label="Leads" value={fmtInt(v.leads)} />
                <MetricChip label="Spend" value={fmtBRL(v.spend)} />
                <MetricChip label="CPL" value={fmtBRL(v.cpl)} />
                <MetricChip label="CPA" value={fmtBRL(v.cpa)} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProducaoCriativos() {
  const [tab, setTab] = useState<Tab>("sugestoes");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [vencedores, setVencedores] = useState<Vencedor[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<ProdutoAtivo[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null); // null = auto
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [s, v, p] = await Promise.all([
        fetchSugestoes(),
        fetchBiblioteca(),
        fetchProdutosAtivos(7).catch(() => [] as ProdutoAtivo[]),
      ]);
      setSugestoes(s);
      setVencedores(v);
      setProdutosAtivos(p);
    } catch (e) {
      toast.error(`Erro: ${e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onGerar = async () => {
    setGerando(true);
    try {
      const r = await gerarSugestoes(produtoSelecionado || undefined);
      toast.success(`${r.imagens} imagens + ${r.videos} vídeos gerados para "${r.produto}"`);
      await carregar();
    } catch (e) {
      toast.error(`Falha ao gerar: ${e}`);
    } finally {
      setGerando(false);
    }
  };

  const onStatus = async (id: string, status: Sugestao["status"]) => {
    setSugestoes((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await atualizarStatus(id, status);
    } catch (e) {
      toast.error(`Falha ao salvar status: ${e}`);
      await carregar();
    }
  };

  const novasCount = sugestoes.filter((s) => s.status === "novo").length;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5 relative">
      <TopNav />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-light tracking-tight">
            <Sparkles className="h-7 w-7 text-neon-cyan" />
            <span>Produção de Criativos</span>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            Sugestões geradas a partir dos top performers · Claude · D1
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-xl glass-card">
          <button
            onClick={() => setTab("sugestoes")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              tab === "sugestoes"
                ? "bg-primary/15 text-neon-cyan border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                : "text-muted-foreground hover:text-foreground border border-transparent",
            )}
          >
            <Lightbulb className="h-4 w-4" />
            Sugestões ({novasCount})
          </button>
          <button
            onClick={() => setTab("biblioteca")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              tab === "biblioteca"
                ? "bg-primary/15 text-neon-cyan border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                : "text-muted-foreground hover:text-foreground border border-transparent",
            )}
          >
            <BookOpen className="h-4 w-4" />
            Biblioteca ({vencedores.length})
          </button>
        </div>

        <Button
          onClick={onGerar}
          disabled={gerando}
          title={
            produtoSelecionado
              ? `Vai gerar para: ${produtoSelecionado}`
              : "Vai gerar para o produto com maior performance na biblioteca (modo auto)"
          }
          className="gap-2 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-400/40 hover:border-fuchsia-300/70 hover:shadow-[0_0_18px_hsl(280_85%_60%/0.35)] text-neon-cyan uppercase tracking-wider text-xs"
          variant="outline"
        >
          {gerando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar novas {produtoSelecionado ? `· ${produtoSelecionado}` : "(auto)"}
            </>
          )}
        </Button>

        <Button onClick={carregar} variant="outline" size="icon" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </motion.div>

      <div>
        {loading ? (
          <Card className="p-12 text-center glass-card">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-neon-cyan" />
            <p className="text-sm text-muted-foreground">Carregando…</p>
          </Card>
        ) : tab === "sugestoes" ? (
          <Sugestoes
            sugestoes={sugestoes}
            onStatus={onStatus}
            produtosAtivos={produtosAtivos}
            produtoSelecionado={produtoSelecionado}
            onSelecionarProduto={setProdutoSelecionado}
          />
        ) : (
          <Biblioteca vencedores={vencedores} />
        )}
      </div>
    </div>
  );
}
