# Ensemble

Ensemble is a Next.js app for the YouCam API Skin AI + Apparel VTO Hackathon combined track. It turns "getting ready" into one coordinated decision: a face scan drives skin-aware color choices, an optional body photo drives apparel try-on, and the final screen returns a single look with outfit, skin prep, makeup, rationale, and shoppable product rows.

The core thesis is the deletion test from the spec: if the skin scan disappears, the outfit result should visibly get worse. Skin AI is not a side panel here; it powers the near-face color rule, skincare prep, makeup finish, and "Why this works" explanation.

## Current Status

- Landing page: `/`
- Product flow: `/studio`
- YouCam proxy: `/api/youcam/[feature]`
- Composer debug harness: `/api/dev/compose`
- Catalog: local JSON snapshot in `src/data/catalog.json`
- Mock mode: built in. If `YOUCAM_API_KEY` is absent, the studio still runs end to end with canned skin responses and a mock cloth result.

## Stack

- Next.js `16.2.10` with the App Router
- React `19.2.4`
- Tailwind CSS 4 and shadcn/ui components
- Zustand for the studio flow state
- Drizzle ORM with Postgres for optional API-response caching
- YouCam API, proxied server-side so API keys never reach the browser

This repo pins Next.js 16. Before changing routing, route handlers, metadata, middleware/proxy behavior, or caching semantics, read the relevant files under `node_modules/next/dist/docs/`. For example, route handler `params` are async in this app, and the old `middleware.ts` convention is now `proxy.ts`.

## Setup

Install dependencies:

```bash
npm install
```

Create local env:

```bash
cp .env.local.example .env.local
```

Run the app:

```bash
npm run dev
```

Open:

- Landing page: http://localhost:3000
- Studio flow: http://localhost:3000/studio

## Environment Variables

```env
YOUCAM_API_KEY=
RAPIDAPI_KEY=
DATABASE_URL=postgresql://ensemble:ensemble@localhost:5432/ensemble
```

`YOUCAM_API_KEY` enables live Skin AI and Apparel VTO calls. Without it, `/api/youcam/[feature]` returns mock responses in the same normalized shape used by the UI.

`DATABASE_URL` enables the API cache. If it is missing or unreachable, cache reads/writes fail open and the app continues to work.

`RAPIDAPI_KEY` is only needed for catalog ingestion scripts. The running demo reads from `src/data/catalog.json` and does not call RapidAPI live.

The ingestion script also supports source-specific keys:

```env
SEPHORA_API_KEY=
ASOS_API_KEY=
```

If those are omitted, it falls back to `RAPIDAPI_KEY`.

## Database

Start local Postgres:

```bash
npm run db:up
```

Push the Drizzle schema:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```

Stop Postgres:

```bash
npm run db:down
```

The only table today is `api_cache`, used to cache deterministic YouCam responses by image hash and feature. Skin-analysis and skin-tone results cache for 30 days. Cloth VTO caches for 90 minutes because signed result URLs are short-lived.

## How The App Works

The studio flow is implemented in `src/components/studio/StudioFlow.tsx` and backed by `src/lib/studio/store.ts`.

Flow:

1. Occasion and country
2. Face upload with a client-side brightness check
3. Skin read through `skin-tone-analysis` and best-effort `skin-analysis`
4. Skin snapshot
5. Skin type, goals, and safety flags
6. Optional full-body upload
7. Size and fit preference
8. Composer
9. Final Look screen

The face read calls `src/lib/studio/client.ts`, which posts multipart form data to the local YouCam proxy. The proxy lives at `src/app/api/youcam/[feature]/route.ts` and supports:

- `skin-tone-analysis`
- `skin-analysis`
- `cloth`

When a YouCam key is set, the proxy runs the 4-step YouCam server-to-server workflow through `src/lib/youcam/client.ts`:

1. Request an upload slot
2. Upload image bytes to the returned URL
3. Create a task
4. Poll until success or error

For cloth VTO, the app uploads the user's body photo and the selected catalog garment image. Separates are chained as layered renders, feeding the output of one call into the next.

## Look Composer

The deterministic recommendation engine is in `src/lib/composer/`.

Key files:

- `undertone.ts` derives undertone and depth from the `skin_color` hex using CIE Lab.
- `palette.ts` maps undertone + depth to a simplified color season and palette, and derives climate season from country/date.
- `rules.ts` applies near-face color constraints, skincare tags, makeup finish rules, and safety suppression.
- `colorMatch.ts` scores catalog colors against the allowed palette.
- `rationale.ts` generates the final skin to outfit to beauty explanation.
- `index.ts` orchestrates the full `composeLook(profile, catalog)` run.

The composer returns a `CompleteLook`:

- outfit garments
- palette used
- near-face color
- skincare prep
- makeup products
- narrative rationale
- structured "Why This Look?" claims

## Catalog

Runtime catalog data lives in:

```text
src/data/catalog.json
```

It is a curated snapshot of apparel and beauty products normalized to the shared `Product` type in `src/lib/types.ts`. The app does not depend on RapidAPI availability during the demo.

Catalog ingestion lives in `scripts/ingest-catalog.mjs`:

```bash
node scripts/ingest-catalog.mjs discover
node scripts/ingest-catalog.mjs ingest
node scripts/ingest-catalog.mjs mens
```

The intended workflow is discover candidates, curate IDs and manual enrichment in `scripts/catalog-picks.json`, then ingest the normalized snapshot. Detail responses are cached under `scripts/probes/detail-cache/` when the script runs.

## Useful Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint
npm run db:up        # start local Postgres
npm run db:down      # stop local Postgres
npm run db:push      # push Drizzle schema
npm run db:generate  # generate Drizzle migration files
npm run db:studio    # open Drizzle Studio
```

YouCam live probe:

```bash
node scripts/test-youcam.mjs path/to/face.jpg
```

Composer harness:

```bash
curl http://localhost:3000/api/dev/compose
curl "http://localhost:3000/api/dev/compose?preset=cool-deep-redness-dinner"
```

The dev compose route is disabled in production.

## Project Map

```text
src/app/                    Next.js routes, layout, API handlers
src/components/landing/     Landing page sections
src/components/studio/      Studio flow screens and UI
src/components/ui/          Shared shadcn-style primitives
src/components/brand/       Logo and petal/bloom brand elements
src/lib/composer/           Deterministic look recommendation engine
src/lib/studio/             Studio state, client calls, brightness check
src/lib/youcam/             YouCam server-to-server workflow helper
src/lib/db/                 Drizzle schema, connection, cache helpers
src/lib/landing/            Landing page copy and image metadata
src/data/catalog.json       Local product catalog snapshot
scripts/                    API probes and catalog ingestion
docs/                       Product, design, content, and build docs
design/                     Pencil mockups
```

## Testing Notes

Recommended local checks:

```bash
npm run lint
npm run build
```

Manual mock-mode flow:

1. Leave `YOUCAM_API_KEY` empty.
2. Run `npm run dev`.
3. Open `http://localhost:3000/studio`.
4. Walk through occasion, face upload, skin questions, body upload, sizing, and final look.

Live integration checks require a real YouCam key and spend API units. Use `scripts/test-youcam.mjs` first to verify field shapes before relying on the full UI.

## Known Gaps

- Client-side image compression is installed but not wired into the upload path yet.
- Live nested score parsing for some `skin-analysis` concerns should be rechecked against production responses.
- Makeup VTO is not implemented; makeup is represented as coordinated product recommendations.
- The app has no accounts, checkout, medical diagnosis, body measurement, native app shell, or live RapidAPI dependency by design.

## Source Docs

Product decisions and open work live in:

- `docs/SPEC.md.md`
- `docs/DEVELOPMENT.md`
- `docs/DESIGN.md`
- `docs/CONTENT.md`
- `docs/TASKS.md`

