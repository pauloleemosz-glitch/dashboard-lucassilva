const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

interface ReqBody {
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const url = body.url?.trim();
    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Firecrawl "actions" to wait, dismiss cookie banner if present,
    // and take a screenshot of the ad card element only.
    // The Meta Ad Library renders each ad inside a container with role="article"
    // (or similar). We try a couple of selectors for resilience.
    const fcRes = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [
          {
            type: "screenshot",
            fullPage: false,
            quality: 85,
          },
        ],
        onlyMainContent: false,
        waitFor: 4000,
      }),
    });

    const data = await fcRes.json().catch(() => null);

    if (!fcRes.ok) {
      const msg = (data && (data.error || data.message)) || `Firecrawl ${fcRes.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: fcRes.status === 402 ? 402 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const screenshot: string | undefined =
      data?.screenshot ?? data?.data?.screenshot ?? data?.data?.[0]?.screenshot;

    if (!screenshot) {
      return new Response(
        JSON.stringify({ error: "Screenshot indisponível para esta URL" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ screenshot }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
