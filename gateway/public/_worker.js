const CUSTOM_HOST = "whichcvfits.grbulegoda.com";
const PREVIEW_HOST = "whichcvfits-domain.pages.dev";
function unavailable(status, message) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (![CUSTOM_HOST, PREVIEW_HOST].includes(url.hostname))
      return unavailable(421, "This hostname is not configured.");
    if (url.protocol !== "https:") {
      url.protocol = "https:";
      return Response.redirect(url.href, 308);
    }
    if (!env.APP)
      return unavailable(
        503,
        "WhichCVFits is temporarily unavailable. Please try again shortly.",
      );
    // Preserve the public host, Origin, cookies and streamed body across the
    // private service binding. Never follow an arbitrary external origin.
    const headers = new Headers(request.headers);
    headers.set("Host", url.host);
    headers.set("X-Forwarded-Host", url.host);
    headers.set("X-Forwarded-Proto", "https");
    const forwarded = new Request(request, { headers });
    try {
      const response = await env.APP.fetch(forwarded);
      if (url.hostname === CUSTOM_HOST) return response;
      // The Pages address is for checks, while the custom hostname is public.
      const result = new Response(response.body, response);
      result.headers.set("X-Robots-Tag", "noindex, follow");
      return result;
    } catch {
      return unavailable(
        502,
        "WhichCVFits is temporarily unavailable. Please try again shortly.",
      );
    }
  },
};
