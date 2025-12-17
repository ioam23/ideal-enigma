export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Optional: a POST endpoint for testing (your relay could live here too)
    if (url.pathname === "/log") {
      if (request.method !== "POST") {
        return new Response("POST only", { status: 405 });
      }
      const body = await request.json().catch(() => null);
      return Response.json({ ok: true, got: body });
    }

    // Serve static assets
    const res = await env.ASSETS.fetch(request);

    // If asset not found, return as-is
    if (res.status === 404) return res;

    // Force downloads for anything in /files/
    if (url.pathname.startsWith("/files/")) {
      const filename = url.pathname.split("/").pop() || "download";
      const headers = new Headers(res.headers);
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
      // You can also set content-type if you want, but not required.
      return new Response(res.body, { status: res.status, headers });
    }

    return res;
  },
};
