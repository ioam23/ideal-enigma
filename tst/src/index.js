export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const res = await env.ASSETS.fetch(request);
    if (res.status === 404) {
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname.endsWith(".zip")) {
      const headers = new Headers(res.headers);
      headers.set("Content-Disposition", 'attachment; filename="brainrot_pack_v7.zip"');
      headers.set("Content-Type", "application/zip");
      return new Response(res.body, { status: res.status, headers });
    }

    return res;
  }
};
