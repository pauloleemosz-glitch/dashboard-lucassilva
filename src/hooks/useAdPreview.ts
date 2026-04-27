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
const errorCache = new Map<string, { msg: string; until: number }>();
const inflight = new Map<string, Promise<void>>();

// Concurrency limiter: max 2 requests at a time, queue the rest
const MAX_CONCURRENT = 2;
const REQUEST_SPACING_MS = 350;
let active = 0;
let lastDispatch = 0;
const queue: Array<() => void> = [];

function schedule(run: () => void) {
  queue.push(run);
  pump();
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const wait = Math.max(0, REQUEST_SPACING_MS - (Date.now() - lastDispatch));
    const next = queue.shift()!;
    active++;
    lastDispatch = Date.now() + wait;
    setTimeout(next, wait);
  }
}

function release() {
  active = Math.max(0, active - 1);
  pump();
}

export function useAdPreview(adId: string, _link: string, autoLoad = false) {
  const [creative, setCreative] = useState<AdCreative | null>(
    () => cache.get(adId) ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const e = errorCache.get(adId);
    return e && e.until > Date.now() ? e.msg : null;
  });
  const triedRef = useRef(false);

  async function load() {
    if (creative || loading) return;
    const cachedErr = errorCache.get(adId);
    if (cachedErr && cachedErr.until > Date.now()) {
      setError(cachedErr.msg);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let promise = inflight.get(adId);
      if (!promise) {
        promise = new Promise<void>((resolve, reject) => {
          schedule(async () => {
            try {
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
              resolve();
            } catch (e) {
              reject(e);
            } finally {
              release();
            }
          });
        });
        inflight.set(adId, promise);
      }
      await promise;
      const cached = cache.get(adId);
      if (cached) setCreative(cached);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar criativo";
      // Cache rate-limit / errors for 5 minutes to avoid hammering
      const ttl = /rate limit|#613/i.test(msg) ? 5 * 60_000 : 60_000;
      errorCache.set(adId, { msg, until: Date.now() + ttl });
      setError(msg);
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
