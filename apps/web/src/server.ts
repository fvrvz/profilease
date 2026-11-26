import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/api';
import { db } from './server/db';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const allowedHosts = process.env['ALLOWED_HOSTS']
  ? process.env['ALLOWED_HOSTS'].split(',').map((h) => h.trim()).filter(Boolean)
  : ['localhost', '127.0.0.1', 'profilease.byfaraaz.com', 'profilease.io'];

const angularApp = new AngularNodeAppEngine({
  allowedHosts,
});

// Parse JSON request bodies
app.use(express.json());

// Inbuilt Backend REST API
app.use('/api', apiRouter);

// Custom Domain Resolution Middleware
// When a client accesses through their custom domain (e.g., drelenavance.com),
// rewrite the route internally to their portfolio slug if visiting the root.
app.use((req: Request, _res: Response, next: NextFunction): void => {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || req.hostname) as string;
  const cleanHost = host.split(':')[0].toLowerCase();

  // If not accessing localhost / IP and not already on /@ or /admin or /api
  if (
    cleanHost &&
    cleanHost !== 'localhost' &&
    cleanHost !== '127.0.0.1' &&
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/admin') &&
    !req.url.startsWith('/@')
  ) {
    const matchedProfile = db.getProfileByCustomDomain(cleanHost);
    if (matchedProfile && (req.url === '/' || req.originalUrl === '/')) {
      const rewrittenPath = `/@${matchedProfile.slug}`;
      const mutableReq = req as { originalUrl: string } & Request;
      mutableReq.url = rewrittenPath;
      mutableReq.originalUrl = rewrittenPath;
    }
  }
  next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  const server = app.listen(port, async (error?: Error) => {
    if (error) {
      throw error;
    }

    console.log(`Profilease Angular SSR & API server listening on http://localhost:${port}`);
    if (process.env['NX_READY_SIGNAL_SOCKET']) {
      try {
        const load = new Function('s', 'return import(s)') as (
          s: string
        ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
        (await load('@nx/js/ready-signal')).emitReadySignal(server);
      } catch {
        // @nx/js isn't installed
      }
    }
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
