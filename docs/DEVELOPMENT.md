# Ensemble — Development Doc
*Build-facing companion to `SPEC.md.md` (source of truth for product decisions). This doc exists so anyone implementing can find tech stack, screens, and implementation approach without re-reading the full spec.*

---

## 1. Concept, in one paragraph
Ensemble turns "getting ready" into one decision instead of two. User states an occasion, scans their face (YouCam Skin AI), uploads a body photo (YouCam Apparel VTO). The skin scan doesn't just drive a separate beauty result — it filters the outfit color shown near the face, and the outfit color chosen then drives the makeup shade/finish. One "Look" screen, one rationale sentence, shoppable. Full product rationale: `SPEC.md.md` §0–§6.

**The one thing every screen must protect:** if you deleted the skin scan, the outfit result must visibly get worse. That's the judged differentiator — not either API alone, but the coordination logic in §6.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Mobile-first |
| Hosting | Vercel, plain project | No agent framework — see decision below |
| API integration | Next.js API routes as proxy | Holds YouCam + RapidAPI keys server-side only, never client |
| YouCam response parsing | `json-bigint` | YouCam IDs exceed 2^53 |
| Image handling | Client-side compression before PUT (e.g. `browser-image-compression`) | Runs pre-upload, before the 4-step workflow starts |
| Polling | Exponential backoff, respecting 5 QPS / 250 req per 300s | Hand-rolled retry loop — see decision below |
| State | Plain React state | One `LookProfile` object threaded through the app, no persistence, no DB |
| Catalog data | RapidAPI: **Sephora** (Api Dojo) for beauty + **ASOS** (DataCrawler) for apparel | Chosen 2026-07-23 — see §6.1. One-time ingestion → local JSON snapshot; demo never calls RapidAPI live |

**Decision — no Vercel Eve / agent framework:** the Look Composer (§6 below) is deterministic rule-based logic, not an LLM reasoning loop. Eve's value (durable execution, sandboxing, subagents, scheduled tasks) doesn't map to a fixed-sequence API pipeline. Revisit only if the "skin diary" reach feature (recurring re-scan reminders) gets scoped in — that's genuinely scheduled/stateful.

---

## 3. The shared data model

```ts
LookProfile {
  // from face scan (Skin AI)
  undertone: "warm" | "cool" | "neutral"
  tone: string; fitzpatrick: number
  colorSeason: "Spring"|"Summer"|"Autumn"|"Winter"
  palette: Hex[]; avoidColors: Hex[]
  skinConditions: { redness, oiliness, moisture, radiance, spots, texture: {ui:number, raw:number} }
  skinFocusAreas: string[]

  // from questionnaire
  skinType: "oily"|"dry"|"combo"|"sensitive"
  skinGoals: string[]
  safetyFlags: { pregnant, breastfeeding, sensitivities, activeTreatment, allergies }
  bodyShape: "hourglass"|"pear"|"apple"|"rectangle"|"invTriangle"
  size: string; fitPref: "fitted"|"regular"|"relaxed"
  occasion: string
  budget?: "value"|"mid"|"premium"     // v2.1 — optional catalog price-band filter

  // derived
  country: string; climateSeason: string
}

CompleteLook {
  occasion: string
  outfit: { garments: Garment[], paletteUsed: Hex[], nearFaceColor: Hex }
  beauty: { skincarePrep: Product[], makeup: Product[] }
  rationale: string
  reasons: { claim: string, source: string }[]   // v2.1 — "Why This Look?" checklist (SPEC §6.4b)
}
```
One object, populated incrementally as the user moves through the flow, read by the Composer at the end. No screen owns a separate copy.

---

## 4. Screens

| # | Screen | Purpose | Key states to design |
|---|---|---|---|
| 1 | Occasion entry | "What are you getting ready for?" + optional budget band + country if unknown | Empty, filled |
| 2 | Face capture | Lighting pre-check → selfie | Lighting-inadequate (live guidance, not just pass/fail), capturing, captured |
| 3 | Analyzing (brief) | Skin snapshot while skin-analysis + skin-tone-analysis run | Loading, skin snapshot shown (empowering-language, §11) |
| 4 | Micro-questionnaire | Skin type, 1–2 goals, safety flags | Chip/pill selection only, no free text |
| 5 | Body capture | Full-body upload + shape/size/fit | Upload guide overlay, example thumbnail, privacy reassurance copy |
| 6 | Composing | Look Composer running (§6) | Staged status text (reading skin tone → choosing palette → rendering outfit), not a blank spinner |
| 7 | The Look (hero) | Outfit on user + coordinated beauty + rationale + "Why This Look?" checklist + shoppable rows | Full result, error/retry state if any API call failed |
| 8 | (Reach) Share card | Shareable look card | — |

Full screen sequence: `SPEC.md.md` §7 and §16.

**UX principles carried into every screen** (from earlier planning): tap-only inputs wherever possible, single clear CTA per screen, non-clinical Trust-layer copy tone (see Content doc), staged/legible loading states instead of blank spinners, mobile ergonomics (large tap targets, no small text inputs).

---

## 5. Implementation notes per major piece

### 5.1 YouCam API workflow
Universal 4-step pattern per feature (`skin-analysis`, `skin-tone-analysis`, `cloth`):
`POST /s2s/v2.0/file/{feature}` → `PUT` bytes to returned URL → `POST /s2s/v2.0/task/{feature}` → `GET /s2s/v2.0/task/{feature}/{task_id}` (poll to success).
Build this once as a shared server-side helper, not per-feature duplicated code. Units charged on success only — no retry loops that redo completed work.

### 5.2 Look Composer (`SPEC.md.md` §6)
Deterministic, in order:
1. Near-face outfit color = palette (undertone) minus avoidColors, then overridden by skin condition (redness/radiance/spots) — §6.1.
2. Skincare prep = skin state × climate × safety suppression — §6.2.
3. Makeup = harmonized to the **chosen outfit color** (not just undertone) + skin state finish + shade-match to tone/fitzpatrick — §6.3. This reverse coupling (outfit → makeup) is the part that proves the two APIs are load-bearing for one output — don't let it get simplified away under time pressure.
4. Rationale = template weaving skin → outfit → beauty → occasion — §6.4.

### 5.3 Safety overrides (§9)
Runs as a suppression pass over skincare/makeup recs after they're generated, not baked into the recommendation logic itself — keeps the override rules auditable and testable in isolation.

### 5.4 Catalog (§12)
RapidAPI source **not yet chosen**. Needs ~20–40 apparel (span the color wheel) + ~15–20 beauty items (shade range, a few lips per color temperature, core skincare) so every profile resolves to a complete look. Normalize to the schema in §12 on ingestion, not on read.

---

## 6. Open items (blocking or near-blocking)

Findings below are from docs.perfectcorp.com (checked 2026-07-21) — official reference pages render client-side, but their `<path>.md` variant returns raw content and was used to pull real field names. Not authenticated against a live API key, so treat as strong-but-not-final; confirm against the API Playground once keys are in hand.

1. **RESOLVED (2026-07-23) — RapidAPI catalog: Sephora (Api Dojo) for beauty + ASOS (DataCrawler) for apparel.** Chosen from the marketplace over generic Google-Shopping-style aggregators because both return *structured retail data* (real categories, variants/shades, sizes, materials) rather than scraped search results — which is what the §12 schema needs.
   - **Ingestion strategy: one-time snapshot, not live.** We only need ~20–40 apparel + ~15–20 beauty items. Pull once via the free tier, normalize to the §12 schema, commit as local JSON (e.g. `src/data/catalog.json`). The demo never depends on RapidAPI uptime, rate limits, or a second live API key — one less failure mode while judges run it.
   - **CONFIRMED field mapping (probed live 2026-07-23, raw samples in `scripts/probes/`):**
     - **Sephora** (`sephora.p.rapidapi.com`, US region): search = `us/products/v2/search?q=&pageSize=&currentPage=` → `products[]{productId, brandName, displayName, heroImage, rating, currentSku{skuId, listPrice}}`. Detail = `us/products/v2/detail?productId=&preferedSku=<skuId>` (**must pass a real skuId — empty param returns 204**) → `currentSku{variationValue (shade name), variationDesc (e.g. "cool deep tone beige" — undertone temperature in words, feed directly to shade matching), ingredientDesc (full INCI list), listPrice, highlights}` + `regularChildSkus[]` (all shades w/ swatch image URLs) + `parentCategory`. Prices are strings ("$25.00") — parse.
     - **ASOS** (`asos10.p.rapidapi.com` — NOT DataCrawler's asos2; this is the one we're subscribed to): search = `api/v1/getProductListBySearchTerm?searchTerm=&currency=USD&country=US&store=US&languageShort=en&sizeSchema=US&limit=&offset=&sort=recommended` → `data.products[]{id, name, brandName, colour (name), price.current.value, price.currency, imageUrl (protocol-relative), url (path)}`. Detail = `api/v1/getProductDetails?productId=` → `data{variants[]{brandSize, isAvailable, colour}, info.aboutMe ("Main: 95% Cotton, 5% Elastane" — material), fitType, description (fit + category cues), gender, media}`.
   - **Manual enrichment is expected at this catalog size:** `primary_color_hex` (APIs return colour names/swatch images, not hex — assign hex per item during curation), `occasion_tags`, `fit`, beauty `finish`. Spec rule applies: hide missing fields, never fabricate.
   - **Trademark caution (SPEC §21):** catalog now contains real Sephora/ASOS brands — fine in the running app, but keep brand logos/marks out of demo-video close-ups and marketing frames.

2. **RESOLVED — `skin-tone-analysis` (really "AI Facial Color Tones Analyzer") does NOT return undertone or Fitzpatrick.** Confirmed response fields: `eye_color`, `eye_color_name` (Amber/Brown/Green/Blue/Gray/Other), `lip_color`, `eyebrow_color`, `skin_color`, `hair_color`, `hair_color_name` (Auburn/Black/Blonde/Brown/Grey-White/Red) — all hex except the two `_name` enums. Checked twice for any Fitzpatrick mention (including prose, not just fields) — none. Also checked `ai_face_analyzer` (a separate facial-geometry endpoint) and the Fitzpatrick marketing page for a link to a specific API doc — neither turned up anything; the marketing page's only CTAs are "contact sales" and a consumer showcase tool, suggesting Fitzpatrick classification may be consumer-app-only or a higher tier, not part of the public `s2s/v2.0` surface.
   - **Decision: derive undertone + depth ourselves from `skin_color`.** Implemented in `src/lib/composer/undertone.ts` — converts the hex to CIE Lab and uses L* for depth (light-medium vs medium-deep) and the angle in the a*/b* plane for undertone (warm/cool/neutral), an ITA°-style approach. This is more defensible than thresholding raw hue, since skin hues all cluster tightly in the orange-red family regardless of undertone — hue alone can't separate them. Still a simplification per SPEC.md.md §11's own "not a professional session" framing. `getColorSeason` in `palette.ts` now takes `(undertone, depth)` instead of `(undertone, fitzpatrick)`. `LookProfile.fitzpatrick` stays optional/unpopulated in case a real value ever surfaces (e.g. from the live Playground).
   - Request side is also unconfirmed for this endpoint beyond `source_file` and `face_angle_strictness_level` (strict/high/medium/low/flexible, default high).

3. **`skin-analysis` — confirmed structurally, one naming correction.** SD concerns: `wrinkle, pore, texture, acne, moisture, firmness, redness, oiliness, radiance, age_spot, dark_circle_v2, eye_bag, droopy eyelids, tear_trough, skin_type` — note it's `age_spot`, not `spots` as written in `SPEC.md.md` §4's `skinConditions` shape; update the type or map on ingestion. `score_info.json` has two shapes: flat `{raw_score, ui_score, output_mask_name}` for most concerns, and a nested-by-subregion form (whole face / T-zone / U-zone) for `texture, acne, pore, wrinkle, skin_type` — our flat `SkinConditionScore` type in `src/lib/types.ts` currently assumes every concern is flat; pick a subregion (whole face) when reading the nested ones. `all.score` and `skin_age` are confirmed top-level siblings, matching the spec.
   - Bonus finding: the `skin_type` concern classifies into **Normal/Oily/Dry/Combination, each ± Redness** (8 categories) — this is a real, usable "detect" path for the questionnaire's `skinType` field (`SPEC.md.md` §5 already allows "type fallback: detect"), not just a manual ask.

4. **`cloth` VTO — field names confirmed.** Request: `src_file_id`/`src_file_url` (user photo), `ref_file_id`/`ref_file_url` (outfit reference) or `template_id` as an alternative, `garment_category` (e.g. `"full_body"`). File API response nests the upload target as `requests: { url, method }`, not a flat `url` — `src/lib/youcam/client.ts` now reflects this. Task status field is **`task_status`**, not `status` (also fixed in the client — this was wrong in the original scaffold). Result image comes back as `results.url`. Error shape: `{ status, error, error_code }` (e.g. `InvalidAccessToken`).
   - Task status field name (`task_status`) was confirmed on both `cloth` and the facial-color-tones endpoint, so `src/lib/youcam/client.ts` treats it as universal across `/task/{feature}/{task_id}` — flag it if any feature turns out to differ.

5. **Makeup VTO existence** — still not confirmed (a `makeup_vto` reference page exists at docs.perfectcorp.com but its content didn't render past the title in this pass). Confirm your API tier includes it and pull its real request/response shape before committing to §6.3 rendering.

Items 1–4 are now resolved enough to build against. Remaining live-key verifications: item 1's exact endpoint/response shapes (RapidAPI playground), item 3's nested score shape, item 4's exact enum for `garment_category`, and item 5 (makeup VTO existence).

---

## 7. Explicitly not building (§17)
Accounts/auth, real checkout, body measurement/size prediction, skin detection from body photo, medical diagnosis, large catalog, native app.
