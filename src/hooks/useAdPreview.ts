import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>(); // adId -> data URL

export function useAdPreview(adId: string, link: string) {
  const [src, setSrc] = useState<string | null>(() => cache.get(adId) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (src || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("competitor-preview", {
        body: { url: link },
      });
      if (fnErr) throw new Error(fnErr.message);
      const screenshot = (data as { screenshot?: string } | null)?.screenshot;
      if (!screenshot) throw new Error("Sem imagem");
      // Firecrawl returns either a base64 string or a hosted URL
      const url =
        screenshot.startsWith("http") || screenshot.startsWith("data:")
          ? screenshot
          : `data:image/png;base64,${screenshot}`;
      cache.set(adId, url);
      setSrc(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar preview");
    } finally {
      setLoading(false);
    }
  }

  return { src, loading, error, load };
}
