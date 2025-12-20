addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Cloudflare Worker: forwards POST JSON to the Discord webhook.
 * Expects:
 * - Header "X-Worker-Token": "<INCOMING_TOKEN>"
 * - Body: valid JSON (Discord-compatible payload)
 *
 * Worker secrets / environment variables (set in Dashboard or Wrangler):
 * - DISCORD_WEBHOOK_URL  (full webhook URL)
 * - INCOMING_TOKEN       (pre-shared secret token)
 */

async function handleRequest(request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "Content-Type": "application/json" } })
  }

  const token = request.headers.get("X-Worker-Token")
  const expected = INCOMING_TOKEN || null
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
  }

  let bodyText
  try {
    bodyText = await request.text()
    JSON.parse(bodyText) // validate JSON
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const webhook = DISCORD_WEBHOOK_URL || null
  if (!webhook) {
    return new Response(JSON.stringify({ error: "Webhook not configured on worker" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }

  try {
    const resp = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: bodyText
    })

    // Forward Discord rate-limit info (429) or response body
    const contentType = resp.headers.get("content-type") || "text/plain"
    const respText = await resp.text()
    return new Response(respText, { status: resp.status, headers: { "Content-Type": contentType } })
  } catch (err) {
    return new Response(JSON.stringify({ error: "Forward failed", detail: err.toString() }), { status: 502, headers: { "Content-Type": "application/json" } })
  }
}
