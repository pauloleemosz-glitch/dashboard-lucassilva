import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>(); // adId -> data URL
const inflight = new Map<string, Promise<void>>();

export function useAdPreview(adId: string, link: string, autoLoad = true) {
  const [src, setSrc] = useState<string | null>(() => cache.get(adId) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triedRef = useRef(false);

  async function load() {
    if (src || loading) return;
    setLoading(true);
    setError(null);
    try {
      // Deduplicate concurrent requests for the same ad
      let promise = inflight.get(adId);
      if (!promise) {
        promise = (async () => {
          const { data, error: fnErr } = await supabase.functions.invoke("competitor-preview", {
            body: { url: link },
          });
          if (fnErr) throw new Error(fnErr.message);
          const screenshot = (data as { screenshot?: string } | null)?.screenshot;
          if (!screenshot) throw new Error("Sem imagem");
          const url =
            screenshot.startsWith("http") || screenshot.startsWith("data:")
              ? screenshot
              : `data:image/png;base64,${screenshot}`;
          cache.set(adId, url);
        })();
        inflight.set(adId, promise);
      }
      await promise;
      const cached = cache.get(adId);
      if (cached) setSrc(cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar preview");
    } finally {
      inflight.delete(adId);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoLoad || triedRef.current || src) return;
    triedRef.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, autoLoad]);

  return { src, loading, error, load };
}
