# TrueHue

One coordinated look — skin and outfit, together. Built for the [YouCam API Skin AI & Apparel VTO Hackathon](https://youcam-api.devpost.com), combined track. Full product spec: `docs/SPEC.md.md`. Build-facing docs: `docs/DEVELOPMENT.md`, `docs/CONTENT.md`, `docs/DESIGN.md`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your keys:

   ```bash
   cp .env.local.example .env.local
   ```

   - `YOUCAM_API_KEY` — from your YouCam API account (see the hackathon's "Get started" steps for the redeem-code flow).
   - `RAPIDAPI_KEY` — from your RapidAPI account, for the apparel/beauty catalog.

   Both keys are used server-side only (Next.js route handlers), never exposed to the client.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project layout

- `docs/` — product spec and build-facing docs (development, content, design).
- `design/` — Pencil `.pen` mockups.
- `src/lib/types.ts` — the shared `LookProfile` / `CompleteLook` data model (spec §4).
- `src/lib/youcam/client.ts` — the YouCam 4-step workflow helper (upload → task → poll), used by the API proxy.
- `src/lib/composer/` — the Look Composer: near-face color rule, skincare/makeup rules, safety suppression, rationale generator (spec §6, §9, §10).
- `src/app/api/youcam/[feature]/route.ts` — server-side proxy for `skin-analysis`, `skin-tone-analysis`, and `cloth`, keeping API keys off the client.

## Open dependencies

See `docs/DEVELOPMENT.md` §6 — the `skin-tone-analysis` and `cloth` response field names are unconfirmed against the live API, and the RapidAPI catalog source hasn't been chosen yet. Resolve both before wiring the composer to real API responses.

## Notes for this Next.js version

This repo pins Next.js 16, which renamed `middleware.ts` to `proxy.ts` and made route `params` a `Promise`. Check `node_modules/next/dist/docs/` for anything that looks off versus older Next.js knowledge before assuming an API works the way it used to.

## Deploy

Plain Vercel project — no agent framework (see `docs/DEVELOPMENT.md` §2 for why Eve isn't used here).
