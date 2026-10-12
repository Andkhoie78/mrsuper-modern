// Cloudflare Pages advanced-mode Worker for MrSuper.
// Routes API, CSRF and uploaded public media through the SAME website origin.
// This avoids cross-site cookie/CSRF failures between pages.dev and onrender.com.
const dynamicPath = (pathname) =>
  pathname === '/up' ||
  pathname.startsWith('/api/') ||
  pathname.startsWith('/sanctum/') ||
  pathname.startsWith('/storage/');

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!dynamicPath(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    let origin;
    try {
      origin = new URL(env.RENDER_API_ORIGIN || '');
      if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/') {
        throw new Error('Invalid API origin');
      }
    } catch {
      return new Response('API upstream is not configured.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const destination = new URL(url.pathname + url.search, origin);
    const headers = new Headers(request.headers);
    headers.delete('host');
    // Do not cache authenticated, session or upload requests at the edge.
    const upstreamRequest = new Request(destination.toString(), {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
      duplex: 'half',
    });
    try {
      return await fetch(upstreamRequest);
    } catch {
      return new Response('API temporarily unavailable.', {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  },
};
