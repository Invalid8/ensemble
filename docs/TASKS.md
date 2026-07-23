# Ensemble — Task Tracker
*Working checklist derived from `SPEC.md.md` v2.1 (§17 scope, §22 milestones) and `DEVELOPMENT.md`. Update statuses here; product decisions still live in the spec.*
*Status as of 2026-07-23 · Deadline: **Aug 17, 2026** (~3.5 weeks)*

Legend: `[x]` done · `[~]` partial · `[ ]` todo · **(R)** = REACH, only if ahead

---

## 0. Plumbing & engine (SPEC §6, §8, §15) — mostly DONE
- [x] Next.js app scaffold, Tailwind, brand system, landing page
- [x] YouCam proxy route (`src/app/api/youcam/[feature]/route.ts`) — keys server-side
- [x] Universal 4-step workflow helper (`src/lib/youcam/client.ts`) — file → PUT → task → poll, `task_status` handling
- [x] Undertone + depth derivation from `skin_color` hex via Lab/ITA° (`composer/undertone.ts`) — replaces missing API field (DEVELOPMENT §6.2)
- [x] Season → palette engine + climate season (`composer/palette.ts`)
- [x] Near-face colour constraints, skincare tags, makeup spec, safety suppression (`composer/rules.ts`)
- [x] Colour matching (`composer/colorMatch.ts`) + `composeLook()` orchestrator (`composer/index.ts`)
- [~] Rationale generator (`composer/rationale.ts`) — narrative exists; **missing v2.1 `reasons[]` checklist output (§6.4b)**
- [ ] `json-bigint` parsing wired into the proxy response path (verify — dep installed)
- [ ] Client-side image compression pre-PUT (`browser-image-compression` installed, not wired)
- [ ] Rate-limit backoff on 429 (5 QPS / 250 per 300s)

## 1. v2.1 spec deltas → code (SPEC §0.1, §4, §6.4b)
- [ ] Add `budget?: "value"|"mid"|"premium"` to `LookProfile` (`src/lib/types.ts`)
- [ ] Add `reasons: {claim, source}[]` to `CompleteLook` + emit from `composeLook()` (claims only from rules that fired, cap 5, empowering-language wording)
- [ ] Budget → price-band filter in catalog matching (relax band rather than incomplete look)
- [ ] Rename/map `spots` → `age_spot` per confirmed API field (DEVELOPMENT §6.3)
- [ ] Handle nested-by-subregion `score_info` shape (texture/acne/pore/wrinkle/skin_type → read whole-face)

## 2. Blockers / decisions (DEVELOPMENT §6)
- [x] **Choose RapidAPI catalog source** — decided 2026-07-23: **Sephora (Api Dojo)** for beauty + **ASOS (DataCrawler)** for apparel; one-time snapshot to local JSON, demo never calls RapidAPI live (DEVELOPMENT §6.1)
- [x] Subscribe to both on RapidAPI free tier + confirm endpoint/response shapes — done 2026-07-23; confirmed mapping recorded in DEVELOPMENT §6.1, raw samples in `scripts/probes/`
- [ ] Redeem YouCam key (1,000 units) + verify all field findings against live Playground
- [ ] Confirm makeup VTO exists in our tier (gates REACH; `makeup_vto` doc page didn't render)

## 3. Capture flow screens (SPEC §7, §16; DEVELOPMENT §4) — NOT STARTED
- [ ] Screen 1 — Occasion entry: occasion chips + optional budget band + country
- [ ] Screen 2 — Face capture: lighting pre-check (live guidance, blocks shutter) → selfie
- [ ] Screen 3 — Analyzing: one upload → two skin tasks; skin snapshot w/ empowering language (§11.1 remap)
- [ ] Screen 4 — Micro-questionnaire: skin type (w/ detect fallback from `skin_type` concern), 1–2 goals, safety flags — chips only
- [ ] Screen 5 — Body capture: upload guide + shape/size/fit + privacy copy
- [ ] Screen 6 — Composing: staged status text, not a blank spinner

## 4. Catalog (SPEC §12) — BUILT 2026-07-23: `src/data/catalog.json` (46 products)
- [x] Ingestion pipeline: `scripts/ingest-catalog.mjs` (discover → curate `scripts/catalog-picks.json` → ingest; detail responses cached in `scripts/probes/detail-cache/` so re-runs are quota-free)
- [x] Curated 28 apparel (all 4 season palettes × dress/blazer/top/trousers/skirt) + 18 beauty (3 foundations incl. 51-shade Fenty, 4 lips spanning cool nude/lavender-was-swapped-to-brick/classic red/neutral, 2 blushes, 9 skincare covering hydrating/oil-control/soothing-centella/brightening/SPF-incl-mineral)
- [x] Enrichment: `primary_color_hex` on all apparel + lips/blush (curated approximations from colour names/shade descs); `occasion_tags` on apparel + makeup; sizes/material/fit auto-extracted (25/28 have material — missing ones hidden, never fabricated); actives auto-extracted from INCI lists
- [ ] Price bands (value/mid/premium terciles per category) — compute at composer load, not in the data
- [ ] `primary_color_hex` → nearest palette colour mapping (exists in `composer/colorMatch.ts` — verify against real catalog)
- [ ] Affiliate URL field populated (demo-grade) — `product_url` currently direct retailer links
- [ ] Trademark check: no brand logo close-ups in demo video frames (SPEC §21)

## 5. The Look screen (SPEC §13) — the winning artifact
- [ ] Hero: VTO result on user (+ makeup inset if R lands, else shade swatches)
- [ ] Unified rationale (2–3 sentences)
- [ ] **"Why This Look?" checklist** — 3–5 sourced checkmarks under the rationale
- [ ] Shoppable rows: outfit (material/fit chips) + beauty (shade-matched, safety-filtered)
- [ ] Trust footer: cosmetic-not-medical + "simplified engine" notes
- [ ] Error/retry state per failed API call

## 6. Trust layer cross-checks (SPEC §11)
- [ ] Empowering-language remap applied everywhere scores surface (banned words: severity, flaw, problem, damage, poor; max 3 focus areas)
- [ ] Safety suppression verified on every skincare/makeup output path
- [ ] Honest try-on framing copy on VTO result
- [ ] Deep-tone test pass: run full flow on medium-to-deep tone photos early (SPEC §19)

## 7. REACH (only if ahead — SPEC §17)
- [ ] **(R)** Makeup VTO render on selfie (3rd API — biggest judge points; gated on task 2.3)
- [ ] **(R)** Shareable look card
- [ ] **(R)** Retail Intelligence Dashboard mock — ONE static screen, labelled *illustrative concept*, ~2h cap
- [ ] **(R)** Skin diary — lowest priority

## 8. Submission (SPEC §21, §23) — start Wk3, not last-minute
- [ ] README: run instructions + API-key setup (judges will run it)
- [ ] Written description: §0.1 pitch line → retailer-question answer → KPI map → dashboard mock as "where this goes"
- [ ] Screenshots
- [ ] Demo video 1–3 min per §23 arc (name APIs aloud; royalty-free audio; no trademarks; public YouTube)
- [ ] Repo public (or shared w/ contact_event@PerfectCorp.com) + license
- [ ] Submit early
