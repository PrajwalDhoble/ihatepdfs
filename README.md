# RepairMyPDF

Fix, convert and optimize your files. A MERN-based online file utility platform (PDF, image and document tools).

## Status: Phase 2 — Core tools implemented and working

Beyond the Phase 1 foundation, **17 tools now have real, working processors** wired end-to-end (upload → server processing → download), not placeholders:

**PDF:** Compress PDF, Merge PDF, Split PDF, JPG to PDF, PNG to PDF
**Image:** Compress Image, Compress JPG, Compress PNG, Compress WebP, Resize Image, JPG↔PNG, JPG↔WebP, PNG↔WebP
**Text:** Word Counter (fully client-side, instant)

Every one of these is marked `status: "active"` in the registry, has a real processor registered in `server/src/processors/`, and a working interactive UI component in `client/src/tools/`. Try them locally after `npm install` (see below).

**Everything else in the registry remains honestly marked `"coming-soon"`** and renders as such in the UI — no fake buttons. See "Known gaps" below for exactly what's left and why.

## Architecture

```
repairmypdf/
├── client/    React + TypeScript + Vite + React Router (SPA)
├── server/    Node.js + Express + TypeScript API
├── shared/    Tool registry — single source of truth for both client & server
└── docker/    Dockerfile.client, Dockerfile.server, nginx.conf
```

The tool registry (`shared/tools/registry.ts`) drives the homepage, category pages, tool pages, navigation, search, sitemap, and SEO metadata everywhere. A tool only becomes reachable via the API once it's **both** `status: "active"` in the registry **and** registered in `server/src/processors/register.ts` — the two are kept in sync deliberately.

## Prerequisites

- Node.js 20+
- npm 9+
- MongoDB — **optional**, not required to run this project (see below)
- **Sharp** (image processing) needs platform-specific native binaries that npm installs automatically — no manual setup needed on Linux/macOS/Windows.

## Installation

```bash
git clone <repo-url> repairmypdf
cd repairmypdf
npm install --workspace client
npm install --workspace server
```

## Environment variables

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | client | Base path for API calls (default `/api`, proxied to the server in dev) |
| `PORT` | server | API port (default 4000) |
| `CLIENT_ORIGIN` | server | Allowed CORS origin |
| `MONGO_URI` | server | Optional. Leave blank to run without MongoDB — job state is tracked in-memory |
| `TEMP_DIR` | server | Isolated temp workspace root for file processing |
| `MAX_UPLOAD_MB` | server | Hard upload size ceiling (per-tool limits in the registry are also enforced) |
| `JOB_EXPIRY_MINUTES` | server | How long an unclaimed job's temp files live before automatic cleanup |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | server | Rate limiting for `/api/tools/*` endpoints |

## MongoDB setup

Not required. The server logs a notice and runs fine without `MONGO_URI` set — job state lives in an in-memory store (`server/src/models/jobStore.ts`). A `Job` Mongoose model is scaffolded for when persisted job history, user accounts, or analytics are actually needed.

## Development

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (proxies /api to the server)
```

Visit `http://localhost:5173` and try, e.g., **Compress PDF**, **Merge PDF**, or **Compress Image** — these call the real API and return a real, downloadable result.

## Testing

Automated tests exist for the processing layer and the API:

```bash
npm run test:server
```

Covers: PDF merge (page count, ordering, rejecting a single file), PDF split (correct ranges, out-of-bounds rejection, ZIP packaging for multi-range), PDF compression (output validity), image compression (size reduction, target-size accuracy), image resize, format conversion, plus API-level tests (health check, tool listing, 404 on unknown tool, 501 on coming-soon tool, file-signature rejection, sitemap correctness). Frontend component tests are not yet written — flagged as a remaining gap.

## Docker

```bash
docker compose up --build
```

Client served by nginx on `:8080` (proxying `/api` to the server), server on `:4000`. MongoDB is commented out until actually needed.

## Production

- `npm run build:client` → static assets in `client/dist`
- `npm run build:server` → compiled JS in `server/dist`, run with `node dist/server/src/index.js`
- Set `NODE_ENV=production`, a real `SITE_URL`/`CLIENT_ORIGIN`
- For crawlable SEO on tool/category pages, prerender routes at build time — not yet implemented (see gaps)

## Security

- Every upload validated against the tool registry's allowed formats, size, and file count **before** processing
- **File signatures (magic bytes)** checked server-side (`server/src/security/fileSignature.ts`) — extension/MIME never trusted alone; covered by an automated test
- Filenames sanitized (`server/src/security/sanitizeFilename.ts`); files on disk always live under a server-generated job UUID
- Isolated temp workspace per job, deleted after download or on a timed sweep, including on failure (try/finally semantics in the controller)
- Rate limiting on processing endpoints, CORS restricted to the configured client origin, `helmet` security headers
- PDF loading is wrapped so a corrupted/malicious PDF fails with a clear error instead of crashing the process

## SEO

- Per-tool/category metadata (title, description, canonical, Open Graph, JSON-LD) generated from the registry
- `GET /sitemap.xml` / `GET /robots.txt` generated dynamically — only active, indexable URLs included (verified by test)
- Client-side rendering means crawlers currently see JS-rendered content — build-time prerendering is the next step before this is fully production-SEO-ready

## Adding a new tool

1. Add an entry to `shared/tools/registry.ts` via `defineTool({...})`, `status: "coming-soon"` until ready.
2. It automatically appears in navigation, its category page, search, and gets a working (upload-only, "Coming Soon") tool page with SEO metadata.
3. Implement its processor in `server/src/processors/`, matching the `ProcessorFn` signature in `processors/index.ts`.
4. Register it: `registerProcessor("your-slug", yourFn)` in `server/src/processors/register.ts`.
5. Flip the registry entry to `status: "active"`.
6. If it needs custom option controls (like Split PDF's page-range field), add them to `client/src/tools/toolOptionFields.tsx` and wire them in `client/src/tools/activeToolRegistry.tsx`. Otherwise `ActiveFileTool` works with zero configuration.

## Known gaps (honest, not hidden)

These remain `"coming-soon"` because implementing them correctly needs something this pass didn't include:

- **PDF↔JPG/PNG (rasterizing PDF pages to images)** — needs a PDF renderer with native bindings (e.g. `pdf-poppler`/`canvas`) not included in this pass.
- **PDF↔Word/Excel/PowerPoint** — realistically needs LibreOffice headless as a sandboxed subprocess; the architecture doc specifies this approach but the subprocess wrapper isn't built yet.
- **OCR PDF** — Tesseract.js is the planned pure-JS approach; not yet wired.
- **Rotate/Crop/Delete/Extract/Rearrange pages, Watermark, Page numbers, Protect/Unlock, Metadata editor, Sign/Fill/Annotate/Flatten, Compare, Repair** — straightforward with `pdf-lib` (same library already used for merge/split/compress) but not yet implemented in this pass.
- **Crop/Rotate/Flip/Metadata-remover images** — trivial additions with `sharp`, not yet wired.
- Build-time SEO prerendering, frontend component tests, real ad network integration, and payment/subscription implementation are all explicitly out of scope per the project's own rules (no fake ads/payments) and are extension points only.

Nothing above is faked in the UI — each shows "Coming Soon" honestly.

## Project state

**Completed:** Phase 0 (architecture) · Phase 1 (foundation) · Phase 2 (17 real, tested, working tools across PDF/image/text, wired client-to-server end-to-end).

**Next up:** the remaining PDF page-manipulation tools (all achievable with the already-installed `pdf-lib`, no new dependencies needed) are the highest-value next batch, followed by the remaining simple image tools (`sharp`, also already installed).
