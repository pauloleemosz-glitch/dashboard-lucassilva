const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH = "https://graph.facebook.com/v21.0";

interface ReqBody {
  adId?: string;
  // Optional country filter; defaults to BR
  country?: string;
}

interface AdCreative {
  imageUrl?: string;
  videoUrl?: string;
  videoThumb?: string;
  title?: string;
  body?: string;
  cta?: string;
  pageName?: string;
  snapshotUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawToken = Deno.env.get("META_ADS_ACCESS_TOKEN");
    const token = normalizeToken(rawToken);
    if (!token) {
      console.error("META_ADS_ACCESS_TOKEN ausente ou vazio");
      return json({ error: "META_ADS_ACCESS_TOKEN não configurado" }, 500);
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const adId = body.adId?.trim();
    const country = (body.country ?? "BR").toUpperCase();
    if (!adId || !/^\d+$/.test(adId)) {
      return json({ error: "adId inválido" }, 400);
    }

    const fields = [
      "id",
      "ad_creative_link_titles",
      "ad_creative_link_descriptions",
      "ad_creative_link_captions",
      "ad_creative_bodies",
      "ad_snapshot_url",
      "page_name",
      "publisher_platforms",
    ].join(",");

    const params = new URLSearchParams({
      ad_type: "ALL",
      ad_active_status: "ALL",
      ad_reached_countries: JSON.stringify([country]),
      search_ids: JSON.stringify([adId]),
      fields,
      access_token: token,
    });

    const fbRes = await fetch(`${GRAPH}/ads_archive?${params.toString()}`);
    const data = await fbRes.json().catch(() => null);

    if (!fbRes.ok) {
      const metaMessage = data?.error?.message as string | undefined;
      const metaCode = data?.error?.code as number | undefined;
      const metaSubcode = data?.error?.error_subcode as number | undefined;
      const metaType = data?.error?.type as string | undefined;
      console.error("Meta Ad Library error", {
        status: fbRes.status,
        metaCode,
        metaSubcode,
        metaType,
        message: metaMessage,
        full: data?.error,
      });

      if (metaMessage?.toLowerCase().includes("access token could not be decrypted")) {
        return json(
          {
            error:
              "O token da Meta salvo no backend é inválido, foi colado com espaços/quebras de linha ou expirou.",
          },
          502,
        );
      }

      const msg = metaMessage || `Graph API ${fbRes.status}`;
      return json({ error: msg }, 502);
    }

    const item = Array.isArray(data?.data) ? data.data[0] : null;
    if (!item) {
      return json({ error: "Anúncio não encontrado na biblioteca" }, 404);
    }

    const creative: AdCreative = {
      title: item.ad_creative_link_titles?.[0],
      body: item.ad_creative_bodies?.[0],
      cta: item.ad_creative_link_captions?.[0],
      pageName: item.page_name,
      snapshotUrl: item.ad_snapshot_url,
    };

    // The ads_archive fields don't expose image/video URLs directly.
    // The reliable way to get the actual creative media is to fetch the
    // ad_snapshot_url HTML and extract the og:image / video poster.
    if (creative.snapshotUrl) {
      try {
        const snapRes = await fetch(creative.snapshotUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          },
        });
        const html = await snapRes.text();

        const ogImage = matchFirst(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        const ogVideo = matchFirst(html, /<meta[^>]+property=["']og:video(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i);
        const videoSrc = matchFirst(html, /"video_hd_url":"([^"]+)"|"video_sd_url":"([^"]+)"/i);
        const imageSrc = matchFirst(
          html,
          /"original_image_url":"([^"]+)"|"resized_image_url":"([^"]+)"/i,
        );

        creative.imageUrl = unescapeJsonUrl(imageSrc) ?? ogImage ?? undefined;
        creative.videoUrl = unescapeJsonUrl(videoSrc) ?? ogVideo ?? undefined;
        if (creative.videoUrl && !creative.imageUrl) {
          creative.videoThumb = ogImage ?? undefined;
        }
      } catch (_) {
        // Non-fatal: we still return what we have
      }
    }

    return new Response(JSON.stringify(creative), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function matchFirst(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  if (!m) return undefined;
  return m[1] ?? m[2];
}

function unescapeJsonUrl(s?: string): string | undefined {
  if (!s) return undefined;
  return s.replace(/\\\//g, "/").replace(/\\u0026/g, "&").replace(/\\\\/g, "\\");
}

function normalizeToken(token?: string | null): string | undefined {
  if (!token) return undefined;
  const normalized = token.replace(/[\r\n\t ]+/g, "").trim();
  return normalized || undefined;
}
