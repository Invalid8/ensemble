# Ensemble — Task Tracker
*Working checklist derived from `SPEC.md.md` v2.1 (§17 scope, §22 milestones) and `DEVELOPMENT.md`. Update statuses here; product decisions still live in the spec.*
*Status as of 2026-08-15 · Deadline: **Aug 17, 2026** (2 days) — product is feature-complete; remaining work is submission artifacts.*

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
- [x] Rationale generator (`composer/rationale.ts`) — narrative + `reasons[]` checklist (§6.4b), emitted from `composeLook()`
- [x] BigInt-safe parsing on the proxy response path — YouCam ids come back as strings, so plain JSON is safe (see note in `youcam/client.ts`)
- [x] Client-side image compression pre-PUT — `lib/studio/compress.ts`, applied once per photo in `readSkin()` and `renderVto()`; skips files under 600KB, fails open
- [x] Rate-limit backoff on 429 (`youcam/client.ts` — exponential backoff + connect retry)

## 1. v2.1 spec deltas → code (SPEC §0.1, §4, §6.4b)
- [x] Add `budget?: "value"|"mid"|"premium"` to `LookProfile` (`src/lib/types.ts`)
- [x] Add `reasons: {claim, source}[]` to `CompleteLook` + emit from `composeLook()` (claims only from rules that fired, cap 5, empowering-language wording)
- [x] Budget → price-band filter in catalog matching (terciles per type, relaxes rather than incomplete look)
- [x] Map `spots` ← `age_spot` at ingestion (StudioFlow `analyze()`)
- [x] Handle nested-by-subregion `score_info` shape on the LIVE API — verified against live responses 2026-07-27

## 2. Blockers / decisions (DEVELOPMENT §6)
- [x] **Choose RapidAPI catalog source** — decided 2026-07-23: **Sephora (Api Dojo)** for beauty + **ASOS (DataCrawler)** for apparel; one-time snapshot to local JSON, demo never calls RapidAPI live (DEVELOPMENT §6.1)
- [x] Subscribe to both on RapidAPI free tier + confirm endpoint/response shapes — done 2026-07-23; confirmed mapping recorded in DEVELOPMENT §6.1, raw samples in `scripts/probes/`
- [x] Redeem YouCam key (1,000 units) + verify field findings against live — key in `.env.local`, live flow verified end to end 2026-07-27
- [x] **Decision:** makeup VTO dropped. Out of time budget; makeup ships as coordinated recommendations + shade swatches per the §17 MUST scope.

## 3. Capture flow screens (SPEC §7, §16; DEVELOPMENT §4) — WALKING SKELETON at `/studio` (2026-07-23)
Built as `src/components/studio/StudioFlow.tsx` — full flow functional in **mock mode** (no YOUCAM_API_KEY → proxy returns canned responses shaped like the confirmed live fields; flips to live automatically when the key lands in `.env.local`). Remaining work per screen = polish to DESIGN.md, not function.
**2026-07-23 redesign: conversational slide flow.** "Dora" stylist persona; one question per slide; answers auto-advance (no Continue buttons except safety, where an empty answer is an answer); welcome → "My name is Dora" → journey choice (✨ glow my skin / 👗 apparel that suits me / 💫 both). Journey branches: `skin` skips body+VTO (beauty-first Look with outfit as "Complete the look" cross-sell); `apparel` still runs the face scan ("your undertone decides your colours" — keeps the §1 deletion-test thesis in every path) with beauty as "Finish the look". Face slide auto-analyzes when the lighting check passes. Back navigation + progress bar throughout.
*2026-07-27: brand styling, mobile viewport/pinned header, mirror-correct capture, gender wardrobe, and chained full-outfit try-on all landed. Screens are done.*
- [x] Screen 1 — Occasion entry: chips + budget band + country
- [x] Screen 2 — Face capture: live camera preview with face/body guidance overlay + luma lighting pre-check (blocks continue, retake guidance), mirror-correct capture
- [x] Screen 3 — Analyzing: one upload → two parallel skin tasks; empowering-language snapshot (strengths + ≤3 focus areas)
- [x] Screen 4 — Micro-questionnaire: skin type w/ detect prefill from `skin_type`, 2 goals max, safety chips
- [x] Screen 5 — Body capture: upload + shape/size/fit + privacy line + guide overlay
- [x] Screen 6 — Composing: staged status text
- [x] Screen 7 — The Look: VTO hero (mock badge), rationale, Why-This-Look checklist, shoppable rows w/ material/fit/shade chips, trust footer, error degradation (VTO fail → garment imagery)
- [x] Client-side image compression before upload — `lib/studio/compress.ts`

## 4. Catalog (SPEC §12) — `src/data/catalog.json` — **136 products (118 apparel, 18 beauty) as of 2026-08-15**
*Expanded 2026-08-15: womenswear top-up (dresses 7 → 25) plus a second menswear pass. Every apparel item now carries a real palette hex (no grey fallbacks), and subcategories are derived from the product name rather than the search term.*
- [x] Ingestion pipeline: `scripts/ingest-catalog.mjs` (discover → curate `scripts/catalog-picks.json` → ingest; detail responses cached in `scripts/probes/detail-cache/` so re-runs are quota-free)
- [x] Curated 28 apparel (all 4 season palettes × dress/blazer/top/trousers/skirt) + 18 beauty (3 foundations incl. 51-shade Fenty, 4 lips spanning cool nude/lavender-was-swapped-to-brick/classic red/neutral, 2 blushes, 9 skincare covering hydrating/oil-control/soothing-centella/brightening/SPF-incl-mineral)
- [x] Enrichment: `primary_color_hex` on all apparel + lips/blush (curated approximations from colour names/shade descs); `occasion_tags` on apparel + makeup; sizes/material/fit auto-extracted (25/28 have material — missing ones hidden, never fabricated); actives auto-extracted from INCI lists
- [x] Price bands (value/mid/premium terciles per category) — computed at composer load
- [x] `primary_color_hex` → nearest palette colour mapping — verified against the real catalog by the Layer-1 preset suite
- [ ] Affiliate URL field populated (demo-grade) — `product_url` is still direct retailer links. **Accepted for submission:** the description names the affiliate model; swapping in wrapper URLs adds no judge-visible value in the time left.
- [ ] Trademark check: no brand logo close-ups in demo video frames (SPEC §21) — do this while recording

## 5. The Look screen (SPEC §13) — the winning artifact — BUILT (`steps/LookStep.tsx`)
- [x] Hero: VTO result on user, with shade swatches for the beauty half
- [x] Unified rationale (2–3 sentences)
- [x] **"Why This Look?" checklist** — sourced checkmarks under the rationale, capped at 5
- [x] Shoppable rows: outfit (material/fit chips) + beauty (shade-matched, safety-filtered)
- [x] Trust footer: cosmetic-not-medical + "simplified engine" notes
- [x] Error/retry state per failed API call — skin-analysis degrades to tone-only, VTO failure degrades to garment imagery

## 6. Trust layer cross-checks (SPEC §11)
- [x] Empowering-language remap applied everywhere scores surface — labels live in `studio/constants.ts`, focus areas capped at 3 in `readSkin()`; no banned word appears anywhere in `src/`
- [x] Safety suppression verified on every skincare/makeup output path — single suppression pass in `composer/rules.ts` runs over already-generated recs
- [x] Honest try-on framing copy on VTO result — TrustFooter adds the "visual simulation, fit will vary" line whenever the render is real
- [ ] **Deep-tone test pass: run the full live flow on medium-to-deep tone photos (SPEC §19).** Highest-value remaining check — this is our stated differentiator and the demo depends on it.

## 7. REACH — ALL DROPPED (out of time budget, SPEC §17 MUST scope is complete)
- [x] ~~Makeup VTO~~ · ~~shareable look card~~ · ~~retail dashboard mock~~ · ~~skin diary~~ — none attempted; the dashboard concept is carried in the written description and demo close as narrative instead of a built screen.

## 8. Testing (end-to-end, layered)
- [x] **Layer 1 — Composer E2E (no key, no UI):** `GET /api/dev/compose?preset=<name>` runs `composeLook()` against the real catalog with 5 synthetic profiles incl. the SPEC §23 demo profile and the §1 deletion test. Built + passing 2026-07-23. Fixed en route: composer filtered by `category` instead of `subcategory` (empty looks), palette-order ties broke toward catalog order instead of the redness rule's cool-first preference, lip/blush matched by raw hex distance instead of §6.3 temperature family, rationale grammar with empty focus areas.
- [x] **Layer 2 — YouCam integration:** live selfie → skin-analysis + skin-tone-analysis, live body photo + garment → cloth VTO. Run against production 2026-07-27, no failures.
- [~] **Layer 3 — UI flow E2E (available NOW in mock mode):** open `http://localhost:3000/studio`, walk occasion → selfie (lighting check) → skin snapshot + questionnaire → body upload → The Look. Mock mode badges itself on the snapshot and hero; the same flow hits the live APIs once `YOUCAM_API_KEY` is set. Mock endpoints verified via multipart POST (all 3 features, 2026-07-23); walked on a phone-sized viewport and re-verified in live mode 2026-07-27.
- [ ] **Layer 4 — Demo dry run:** the §23 arc, timed under 3:00, on-device, as the final E2E gate before recording. **Do this immediately before recording.**

## 8b. Hardening pass (2026-08-15)
- [x] **Per-visitor usage cap** (`lib/youcam/quota.ts`) — 3 looks per 12h, env-tunable. Charges only on a real API spend: cache hits are free, and failures that never reached YouCam are free. Over-quota returns 429 and the studio shows a calm "come back later" screen (`steps/LimitStep.tsx`) rather than an error.
- [x] **Catalog expansion** — 70 → 136 products; women's dresses 7 → 25; men's blazers 3 → 9.
- [x] **Catalog data repair** (`ingest-catalog.mjs clean`) — subcategory now derived from the product name (brand-aware, so "Tommy Jeans oxford shirt" is a top, and "blazer ... and maxi skirt set" is a blazer); colour vocabulary widened so zero apparel items fall back to neutral grey.
- [x] **Menswear beauty fix** — a men's look no longer recommends lipstick and blush, and its rationale no longer promises a lip. It finishes on skincare, with a prep-sourced reason so the deletion test stays legible on that path.
- [x] **"Why This Look?" checklist finished to §6.4b** — checkmarks plus a visible source label per claim ("skin-tone API", "skin-analysis API"), instead of unsourced chips.
- [x] Dev presets set `wardrobe`, so the Layer-1 harness stops returning mixed-gender outfits the real app cannot produce.

## 9. Submission (SPEC §21, §23) — THE ONLY REMAINING WORK
- [x] README: run instructions + API-key setup (judges will run it)
- [x] Written description — drafted in `docs/SUBMISSION.md` §1, ready to paste
- [x] Repo public + license — github.com/KrownWealth/ensemble, MIT in `LICENSE`
- [x] `npm run lint` + `npm run build` both clean
- [ ] **Screenshots** — 5 shots, list in `SUBMISSION.md` §3
- [ ] **Demo video** 1–3 min — script in `SUBMISSION.md` §2 (name APIs aloud; royalty-free audio; no trademarks; public YouTube)
- [ ] **Submit early** — do not wait for Aug 17
