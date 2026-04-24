import { corsHeaders } from "@supabase/supabase-js/cors";

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

    const fcRes = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["screenshot"],
        onlyMainContent: false,
        waitFor: 2500,
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

    // v2 may return { data: { screenshot } } or { screenshot } at root
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
