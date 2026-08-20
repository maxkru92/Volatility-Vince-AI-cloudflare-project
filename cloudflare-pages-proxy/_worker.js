const UPSTREAM = "https://volatility-vince-ai-cloudflare-project-worker.maxkrupp.workers.dev";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM);
    const headers = new Headers(request.headers);
    headers.set("X-KC-Pages-Proxy", "volatility-vince-ai-cloudflare-project");
    headers.set("X-Forwarded-Host", incoming.host);

    return fetch(new Request(upstream, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    }));
  },
};
