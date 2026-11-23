# Profilease ⚡

**Bespoke Portfolio & Booking Engine for Doctors, Teachers, and Professionals.**

Built on **Angular v22** with Zoneless Signal Architecture, **Signal Forms (`@angular/forms/signals`)**, strictly typed TypeScript, and an **Inbuilt Angular SSR Backend** with Multi-Tenant Custom Domain Resolution.

---

## 🚀 Features

- **Architectural Pointy Aesthetic**: Strict zero rounded corners (`border-radius: 0px !important;`), high-contrast neo-brutalist cards, crisp typography, and sharp badges.
- **Dynamic Portfolio Presets**:
  - **Medical & Healthcare**: Clinical credentials, emergency notice banners, specialized consultations, clinic hours.
  - **Academic & Education**: Faculty honors, course mentorship cards, research guidance, academic calendar.
  - **Executive & Wellness**: Obsidian & warm amber themes for coaches and consultants.
- **Signal Forms Scheduling Engine**:
  - Built using Angular v22 `@angular/forms/signals` (`form()`, `FormField`, `required`, `email`).
  - Interactive date picker, slot calculation based on weekly availability, patient/student intake form, and instant confirmation receipt.
- **Admin Control Room (`/admin`)**:
  - Role-guarded via functional `adminGuard`.
  - Client Onboarding Wizard: Step-by-step onboarding for new practitioners.
  - Appointment Management: Filter, approve, cancel, or complete bookings.
  - Custom Domains Manager: Manage and verify client custom domain host mappings.
- **Inbuilt Backend with Host Header Mapping**:
  - Runs in Angular's SSR server (`apps/web/src/server.ts`) via Express.
  - Inspects incoming `Host` header (e.g., `drelenavance.com`) to serve the client's portfolio transparently as an independent website.
- **Zero `any` TypeScript**: Strict type safety end-to-end with shared models in `@profilease/types`.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 22+
- npm 10+

### Installation & Local Development

```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Or build and start the SSR production server with built-in API
npm run build
npm start
```

Navigate to:
- Public Showcase & Directory: `http://localhost:4000/`
- Dr. Vance's Medical Profile: `http://localhost:4000/@dr-elena-vance`
- Prof. Chen's Academic Profile: `http://localhost:4000/@prof-marcus-chen`
- Admin Portal: `http://localhost:4000/admin` *(Login: `admin@profilease.io` / `admin123`)*

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run affected tests only (Difference Test)
npm run test:affected
```

---

## 🐳 Docker Deployment

A multi-stage, lightweight production Dockerfile is included:

```bash
# Build the production Docker image
docker build -t profilease .

# Run the container
docker run -d -p 4000:4000 --name profilease profilease
```

The container runs as an unprivileged non-root user (`profilease:1001`) with an integrated healthcheck endpoint.

---

## 🌐 Custom Domain Setup for Clients

To point an external domain (e.g. `drelenavance.com`) to a client's Profilease website:

1. **CNAME Record (Subdomain)**:
   - Type: `CNAME`
   - Host: `www` or `clinic`
   - Target: `profilease.io`
2. **A Record (Root/Apex Domain)**:
   - Type: `A`
   - Host: `@`
   - Target: `YOUR_SERVER_IP`

The internal host-header resolution middleware inspects the request hostname and automatically renders the client's portfolio on the root route `/`.

---

## 🔄 GitHub Actions Workflows

- **`.github/workflows/ci.yml`**: Automatically runs on push/PR, installs dependencies, calculates git SHA diff, tests **affected projects only** to save CI time, and validates the build.
- **`.github/workflows/deploy-pages.yml`**: Automatically builds the browser client with SPA routing fallback (`404.html`) and deploys to **GitHub Pages**.
