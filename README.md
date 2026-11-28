# Profilease

Multi-tenant portfolio and appointment booking platform for independent practitioners (doctors, educators, consultants).

Live instance: [profilease.byfaraaz.com](https://profilease.byfaraaz.com)

## Stack

- **Frontend**: Angular 22 (zoneless, signal forms), Tailwind CSS, `@jsverse/transloco` (`en` / `hi`)
- **API / Edge Worker**: Hono + Drizzle ORM running on Cloudflare Workers (`apps/web/worker.ts`)
- **Database**: Cloudflare D1 (SQLite) with SQL migrations in `migrations/`
- **Payments**: PayPal (`@paypal/paypal-server-sdk`)
- **Email & Storage**: Resend for transactional emails, Tigris (S3-compatible) for media uploads
- **Monorepo**: Nx (`apps/web`, `apps/notifications`, `libs/shared/types`)

## Project Layout

```text
apps/
  web/                Angular app + Cloudflare Worker API (src/worker/)
  notifications/      NestJS notification worker
libs/
  shared/types/       Shared TypeScript types & plan capabilities (@profilease/types)
migrations/           D1 SQL migrations (0001 .. 0005)
wrangler.jsonc        Cloudflare Worker & D1 configuration
```

## Local Development

Requirements: Node.js 22+ and npm 10+.

```bash
git clone https://github.com/fvrvz/profilease.git
cd profilease
npm ci
cp .env.example .env
```

Start the Angular dev server:

```bash
npm run dev
```

Build the app and test the Worker locally with Wrangler:

```bash
npm run build
npx wrangler d1 migrations apply profilease-db --local
npx wrangler dev
```

## Testing & Verification

Before opening a PR, make sure the Worker typecheck, production build, unit tests, and Wrangler dry-run all pass:

```bash
# Worker strict typecheck
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --strict --skipLibCheck --types @cloudflare/workers-types apps/web/worker.ts

# Web production build
npm run build

# Unit tests
npm test

# Worker bundle check
npx wrangler deploy --dry-run
```

## Custom Domains

Practitioners can serve their portfolio from their own domain (for example, `clinic.example.com`):

1. Point a `CNAME` record (subdomain) or `A` record (apex) to the Cloudflare Worker host.
2. Register the domain in the admin domain manager (`/admin`).
3. Requests whose `Host` / `X-Forwarded-Host` header is not listed in `PLATFORM_HOSTS` (`wrangler.jsonc`) are resolved to the matching practitioner profile on `/`.

## Contributing

Contributions are welcome. This repository uses `develop` as the integration branch and `main` for production releases.

1. Fork the repository and create a branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b fix/your-change
   ```
2. Keep changes focused. If you modify the D1 schema (`apps/web/src/worker/db/schema.ts`), add a numbered migration file in `migrations/`.
3. Run the verification commands listed above (`tsc`, `npm run build`, `npm test`).
4. Commit your changes and open a pull request targeting **`develop`** (do not open PRs directly against `main`).
5. Ensure all CI checks pass before review.

## License

Licensed under the [MIT License](LICENSE).
