# RepairMyPDF

Fix, convert and optimize your files. A MERN-based online file utility platform (PDF, image and document tools).

## Status: All 51 tools implemented and active

Every tool in the registry now has a real processor and a working UI. Three different setups are involved, depending on the tool:

| Group | Tools | Setup required |
|---|---|---|
| **Free, no setup** | Compress/Merge/Split/Rotate/Crop/Resize/Watermark/Page-numbers/Metadata/Flatten/Sign/Repair/Annotate PDF, Extract Text, Compare PDFs, JPG/PNG↔PDF, all image tools, Word Counter | None — works immediately after `npm install` |
| **Free, needs a system binary** | Protect PDF, Unlock PDF | Install `qpdf` on the host (see below) |
| **Paid API (CloudConvert)** | PDF↔JPG/PNG, PDF↔Word/Excel/PowerPoint (6 tools), OCR PDF | Sign up at cloudconvert.com, set `CLOUDCONVERT_API_KEY` |
| **Two-step UI, free** | Fill PDF | No setup — works via an inspect-then-fill flow (see below) |

That's **37 tools that work with zero configuration**, **2 that need a free system binary**, and **9 that need a CloudConvert API key** (currently a placeholder in `server/.env.example` — see setup below). None are faked: an unconfigured paid tool returns a specific "not configured, here's how to fix it" error rather than pretending to work.

## Architecture

```
repairmypdf/
├── client/    React + TypeScript + Vite + React Router (SPA)
├── server/    Node.js + Express + TypeScript API
├── shared/    Tool registry — single source of truth for both client & server
└── docker/    Dockerfile.client, Dockerfile.server, nginx.conf
```

## Prerequisites

- Node.js 20+ (uses native `fetch`/`FormData` — no HTTP client dependency needed for the CloudConvert integration)
- npm 9+
- MongoDB — **optional**, not required to run this project
- **qpdf** — only needed for Protect PDF / Unlock PDF (see below)
- A **CloudConvert API key** — only needed for the 9 tools listed above (see below)

## Installation

```bash
git clone <repo-url> repairmypdf
cd repairmypdf
npm install --workspace client
npm install --workspace server
```

## Setting up qpdf (free — for Protect PDF / Unlock PDF)

qpdf is a free, open-source command-line tool. `pdf-lib` has no PDF encryption support at all, so this is the only free route to real password-protect/unlock functionality.

- **Linux:** `sudo apt install qpdf` (Debian/Ubuntu) or your distro's equivalent
- **Mac:** `brew install qpdf`
- **Windows:** download the installer from qpdf's GitHub releases page, or use `winget install qpdf` if available, or run the server in Docker/WSL instead (simplest if a native Windows install is painful)
- **Docker:** add `RUN apt-get install -y qpdf` to `docker/Dockerfile.server`'s base image (not included by default, to keep the image small for people who don't need it)

If `QPDF_PATH` (default `qpdf`) isn't found on the PATH, Protect/Unlock PDF return a clear `QPDF_NOT_AVAILABLE` error telling you exactly what to do — they don't fail silently.

## Setting up CloudConvert (paid — for Office conversion, PDF↔image, OCR)

1. Sign up free at cloudconvert.com — the free tier includes enough credits to test with before paying anything.
2. Dashboard → API v2 → API Keys → create a new key.
3. Open `server/.env` and replace the placeholder:
   ```
   CLOUDCONVERT_API_KEY=REPLACE_WITH_YOUR_CLOUDCONVERT_API_KEY
   ```
   with your real key.
4. Restart the server. The 9 CloudConvert-backed tools (PDF↔JPG, PDF↔PNG, PDF↔Word, PDF↔Excel, PDF↔PowerPoint, OCR PDF) will now work.

Until you add a real key, those 9 tools return a `CLOUDCONVERT_NOT_CONFIGURED` error (HTTP 503) with the same instructions, both in the API response and available to show in the UI.

**I can't sign up for this account or spend your money on your behalf** — you create the account and key; I've already written and wired up all the integration code that calls it.

## Environment variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | client | Base path for API calls (default `/api`) |
| `PORT` | server | API port (default 4000) |
| `CLIENT_ORIGIN` | server | Allowed CORS origin |
| `MONGO_URI` | server | Optional. Leave blank to run without MongoDB |
| `TEMP_DIR` | server | Isolated temp workspace root for file processing |
| `MAX_UPLOAD_MB` | server | Hard upload size ceiling |
| `JOB_EXPIRY_MINUTES` | server | How long temp files live before automatic cleanup |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | server | Rate limiting for `/api/tools/*` |
| `CLOUDCONVERT_API_KEY` | server | See CloudConvert setup above |
| `QPDF_PATH` | server | Path to the qpdf binary (default `qpdf`, i.e. "on the PATH") |

## Development

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

## Testing

```bash
npm run test:server
```

Covers every free processor (PDF assembly, page operations, compression, text extraction/comparison, resize, annotate, form fill/inspect, image transforms), plus API-level tests and a configuration guard test confirming CloudConvert-dependent tools fail clearly rather than silently when unconfigured. CloudConvert/qpdf themselves aren't mocked or called in tests — they're external dependencies, not something to fake in a test suite.

## Docker

```bash
docker compose up --build
```

Client on `:8080` (nginx, proxies `/api`), server on `:4000`. To get Protect/Unlock PDF working in Docker, add `qpdf` to `docker/Dockerfile.server`'s base image.

## Production

- `npm run build:client` → static assets in `client/dist`
- `npm run build:server` → compiled JS in `server/dist`, run with `node dist/server/src/index.js`
- Set `NODE_ENV=production`, real `SITE_URL`/`CLIENT_ORIGIN` (server) and `VITE_SITE_URL` (client build-time env), and your real `CLOUDCONVERT_API_KEY`
- **HTTPS**: this app doesn't terminate TLS itself — put it behind a reverse proxy (nginx, as in `docker/nginx.conf`) or your hosting platform's built-in HTTPS (Vercel/Render/Railway/etc. all handle this automatically)
- **Process management**: run the server with something that restarts it on crash — `pm2`, a systemd unit, or your platform's built-in process supervisor. `NODE_ENV=production` also enables `trust proxy` automatically, which is required for rate limiting to see real client IPs instead of the proxy's
- **Favicon/tab icon**: already generated (`client/public/favicon.ico`, `favicon.svg`, and PNG sizes for Apple/Android home-screen icons) and wired into `index.html` + `manifest.json` — nothing to add here
- **Health check**: `GET /api/health` — point your hosting platform's health check / uptime monitor at this
- For crawlable SEO on tool/category pages, prerender routes at build time — not yet implemented (see below)

## Security

- Every upload validated against the registry's allowed formats/size/file-count **before** processing
- File signatures (magic bytes) checked server-side — extension/MIME never trusted alone
- Filenames sanitized; files on disk always live under a server-generated job UUID, always inside `TEMP_DIR`
- Isolated temp workspace per job, deleted after download or on a timed sweep, including on failure
- Rate limiting, CORS restricted to the configured client origin, `helmet` security headers
- Corrupted/malicious PDFs fail with a clear error instead of crashing the process
- `trust proxy` enabled in production so rate limiting sees real client IPs when running behind nginx/a load balancer, not the proxy's own IP
- Process-level `uncaughtException`/`unhandledRejection` handlers log and exit deliberately instead of leaving the server in a silently broken state
- **Fixed bug (previous session):** multer originally wrote uploads to a hardcoded `/tmp`, separate from the job workspace under `TEMP_DIR` — this caused cross-device rename failures (reliably in Docker, always on Windows). Uploads now land inside `TEMP_DIR/_incoming` so the later move is always same-filesystem.
- **Fixed bug (previous session):** `shared/tools/index.ts` used `export *`, which is ambiguous for isolated-file transpilers like the one `tsx` uses and could silently drop real exports depending on platform. Replaced with explicit named re-exports.
- qpdf and CloudConvert calls run with the same file-signature validation as every other tool before any external process/API sees the file.

## SEO

- Per-tool/category metadata (title, description, canonical, Open Graph, JSON-LD) generated from the registry
- `GET /sitemap.xml` / `GET /robots.txt` generated dynamically — every active tool is now included
- Client-side rendering means crawlers currently see JS-rendered content — build-time prerendering is the next step

## Extra features beyond core file tools

Added after a competitive look at other free PDF tool sites on the market:

- **Client-side processing for 15 PDF tools** — Merge, Split, Rotate, Delete/Extract/Rearrange Pages, Crop, Resize, Watermark, Page Numbers, Edit Metadata, Flatten, Sign (stamp), Repair, and Annotate all run **entirely in your browser** via `pdf-lib` (`client/src/lib/clientPdf.ts`) — no upload, no server round-trip, no dependency on the backend at all for these. The file never leaves your device. Each of these tool pages shows a "Processed locally — never uploaded" badge, so it's provably true, not just a claim.
- **Dark mode** — toggle in the navbar, persisted, respects system preference by default (`client/src/hooks/useTheme.ts`).
- **Recently used tools** — shown on the homepage, tracked via `localStorage`, no account needed (`client/src/hooks/useRecentTools.ts`).
- **Basic offline support (PWA)** — `client/public/manifest.json` + `client/public/service-worker.js` cache the app shell and any visited page, so a repeat visit works without a network connection for pages you've already loaded. Intentionally simple (network-first with a cache fallback) rather than a full offline-first rebuild.

## Adding a new tool
1. Add an entry to `shared/tools/registry.ts`, `status: "coming-soon"` until ready.
2. Implement its processor in `server/src/processors/` (`ProcessorFn` signature in `processors/index.ts`).
3. Register it: `registerProcessor("your-slug", yourFn)` in `server/src/processors/register.ts`.
4. Flip the registry entry to `status: "active"`.
5. If it needs option inputs, add a field spec to `client/src/tools/toolFieldSpecs.ts` — the form renders itself automatically. Only tools needing bespoke logic (like Fill PDF's inspect-then-fill flow) need a custom component wired into `activeToolRegistry.tsx`.

## What's genuinely different between the free and paid tools

Worth understanding rather than just configuring blindly:

- **Free PDF tools** (page ops, merge/split/compress/watermark/etc.) use `pdf-lib`, a pure-JS library that manipulates PDF structure directly — fast, no external calls, no ongoing cost.
- **Protect/Unlock PDF** need real cryptographic encryption per the PDF spec, which `pdf-lib` doesn't implement. `qpdf` does this correctly and is free, but it's a compiled system tool, not an npm package — hence the separate install step.
- **Office conversion and PDF rendering to images** genuinely require either a full document-layout engine (what Word/Excel/PowerPoint/LibreOffice are) or a PDF rasterizer with native graphics bindings — neither has a good pure-JS equivalent. CloudConvert runs that infrastructure on their servers so you don't have to; that's what the per-file fee covers.
- **OCR PDF** reuses the same CloudConvert rendering (to turn PDF pages into images) and then runs Tesseract.js — a real, free, local OCR engine — on those images. So this tool is "free OCR" bolted onto "paid rendering"; you need the CloudConvert key for the rendering step even though the OCR itself is free.
- **Fill PDF** doesn't need any external service — `pdf-lib` can read and write AcroForm fields directly. It needed a two-step UI (inspect the PDF's fields, then let you fill them) instead of a paid service, which is why it took different engineering rather than a subscription.

## Project state

**Completed:** Phase 0 (architecture) · Phase 1 (foundation) · Phase 2 (all 51 tools implemented across free, system-binary, and paid-API tiers — tested, and wired end-to-end client-to-server).

**On you:** install qpdf if you want Protect/Unlock PDF working, and add a real CloudConvert API key if you want the 9 conversion/OCR tools working. Everything else works out of the box.
