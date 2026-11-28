import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './src/worker/db/schema';
import { profiles } from './src/worker/db/schema';
import { appointmentsRoutes } from './src/worker/routes/appointments.routes';
import { authRoutes } from './src/worker/routes/auth.routes';
import { billingRoutes } from './src/worker/routes/billing.routes';
import { clientRoutes } from './src/worker/routes/client.routes';
import { mediaRoutes } from './src/worker/routes/media.routes';
import { profilesRoutes } from './src/worker/routes/profiles.routes';
import type { AppContext, Env } from './src/worker/types';

const app = new Hono<AppContext>();

app.use('/api/*', cors({ origin: '*' }));

app.route('/api', profilesRoutes);
app.route('/api', authRoutes);
app.route('/api/client', clientRoutes);
app.route('/api/appointments', appointmentsRoutes);
app.route('/api', mediaRoutes);
app.route('/api/billing', billingRoutes);

app.all('/api/*', (c) => c.json({ error: 'Endpoint not found' }, 404));

const PLATFORM_HOSTS = new Set<string>([
  'localhost',
  '127.0.0.1',
  'profilease.byfaraaz.com',
  'www.profilease.byfaraaz.com',
  'profilease.io',
  'www.profilease.io',
]);

async function serveSpaIndex(env: Env, url: URL, request: Request): Promise<Response> {
  try {
    const spaIndex = await env.ASSETS.fetch(new Request(new URL('/', url.origin).toString(), request));
    if (spaIndex.status === 200) return spaIndex;
  } catch {
    // Fall through to index.csr.html
  }
  return env.ASSETS.fetch(new Request(new URL('/index.csr.html', url.origin).toString(), request));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.hostname;
    const cleanHost = rawHost.split(':')[0].toLowerCase().trim();
    const isPlatformHost =
      !cleanHost ||
      cleanHost.includes('workers.dev') ||
      cleanHost.includes('pages.dev') ||
      PLATFORM_HOSTS.has(cleanHost);
    const isStaticAssetRequest = /\.[a-zA-Z0-9]{1,8}$/.test(url.pathname);

    if (!isPlatformHost) {
      const db = drizzle(env.DB, { schema });
      const row = await db
        .select({ slug: profiles.slug })
        .from(profiles)
        .where(sql`LOWER(${profiles.customDomain}) = ${cleanHost}`)
        .get();

      if (!row?.slug) {
        return isStaticAssetRequest
          ? env.ASSETS.fetch(request)
          : new Response('Domain not configured', { status: 404 });
      }
      if (url.pathname !== '/' && !isStaticAssetRequest) {
        return Response.redirect(new URL('/', url.origin).toString(), 302);
      }
      if (url.pathname === '/') {
        return serveSpaIndex(env, url, request);
      }
    }

    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
    } catch {
      // Fall through to SPA fallback
    }

    return serveSpaIndex(env, url, request);
  },
};
