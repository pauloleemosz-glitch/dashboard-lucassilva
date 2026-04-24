import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdCreative {
  imageUrl?: string;
  videoUrl?: string;
  videoThumb?: string;
  title?: string;
  body?: string;
  cta?: string;
  pageName?: string;
  snapshotUrl?: string;
}

const cache = new Map<string, AdCreative>();
const inflight = new Map<string, Promise<void>>();

export function useAdPreview(adId: string, _link: string, autoLoad = true) {
  const [creative, setCreative] = useState<AdCreative | null>(
    () => cache.get(adId) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triedRef = useRef(false);

  async function load() {
    if (creative || loading) return;
    setLoading(true);
    setError(null);
    try {
      let promise = inflight.get(adId);
      if (!promise) {
        promise = (async () => {
          const { data, error: fnErr } = await supabase.functions.invoke(
            "meta-ad-creative",
            { body: { adId } },
          );
          if (fnErr) throw new Error(fnErr.message);
          const result = data as AdCreative & { error?: string };
          if (result?.error) throw new Error(result.error);
          if (
            !result?.imageUrl &&
            !result?.videoUrl &&
            !result?.videoThumb &&
            !result?.snapshotUrl
          ) {
            throw new Error("Sem mídia disponível");
          }
          cache.set(adId, result);
        })();
        inflight.set(adId, promise);
      }
      await promise;
      const cached = cache.get(adId);
      if (cached) setCreative(cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar criativo");
    } finally {
      inflight.delete(adId);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoLoad || triedRef.current || creative) return;
    triedRef.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, autoLoad]);

  return { creative, loading, error, load };
}
