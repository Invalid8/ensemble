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
| Catalog data | RapidAPI (apparel + beauty) | **Not yet chosen — open item, see §6** |

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

  // derived
  country: string; climateSeason: string
}

CompleteLook {
  occasion: string
  outfit: { garments: Garment[], paletteUsed: Hex[], nearFaceColor: Hex }
  beauty: { skincarePrep: Product[], makeup: Product[] }
  rationale: string
}
```
One object, populated incrementally as the user moves through the flow, read by the Composer at the end. No screen owns a separate copy.

---

## 4. Screens

| # | Screen | Purpose | Key states to design |
|---|---|---|---|
| 1 | Occasion entry | "What are you getting ready for?" + country if unknown | Empty, filled |
| 2 | Face capture | Lighting pre-check → selfie | Lighting-inadequate (live guidance, not just pass/fail), capturing, captured |
| 3 | Analyzing (brief) | Skin snapshot while skin-analysis + skin-tone-analysis run | Loading, skin snapshot shown (empowering-language, §11) |
| 4 | Micro-questionnaire | Skin type, 1–2 goals, safety flags | Chip/pill selection only, no free text |
| 5 | Body capture | Full-body upload + shape/size/fit | Upload guide overlay, example thumbnail, privacy reassurance copy |
| 6 | Composing | Look Composer running (§6) | Staged status text (reading skin tone → choosing palette → rendering outfit), not a blank spinner |
| 7 | The Look (hero) | Outfit on user + coordinated beauty + rationale + shoppable rows | Full result, error/retry state if any API call failed |
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

1. **RapidAPI catalog choice** — still not selected.

2. **RESOLVED — `skin-tone-analysis` (really "AI Facial Color Tones Analyzer") does NOT return undertone or Fitzpatrick.** Confirmed response fields: `eye_color`, `eye_color_name` (Amber/Brown/Green/Blue/Gray/Other), `lip_color`, `eyebrow_color`, `skin_color`, `hair_color`, `hair_color_name` (Auburn/Black/Blonde/Brown/Grey-White/Red) — all hex except the two `_name` enums. Checked twice for any Fitzpatrick mention (including prose, not just fields) — none. Also checked `ai_face_analyzer` (a separate facial-geometry endpoint) and the Fitzpatrick marketing page for a link to a specific API doc — neither turned up anything; the marketing page's only CTAs are "contact sales" and a consumer showcase tool, suggesting Fitzpatrick classification may be consumer-app-only or a higher tier, not part of the public `s2s/v2.0` surface.
   - **Decision: derive undertone + depth ourselves from `skin_color`.** Implemented in `src/lib/composer/undertone.ts` — converts the hex to CIE Lab and uses L* for depth (light-medium vs medium-deep) and the angle in the a*/b* plane for undertone (warm/cool/neutral), an ITA°-style approach. This is more defensible than thresholding raw hue, since skin hues all cluster tightly in the orange-red family regardless of undertone — hue alone can't separate them. Still a simplification per SPEC.md.md §11's own "not a professional session" framing. `getColorSeason` in `palette.ts` now takes `(undertone, depth)` instead of `(undertone, fitzpatrick)`. `LookProfile.fitzpatrick` stays optional/unpopulated in case a real value ever surfaces (e.g. from the live Playground).
   - Request side is also unconfirmed for this endpoint beyond `source_file` and `face_angle_strictness_level` (strict/high/medium/low/flexible, default high).

3. **`skin-analysis` — confirmed structurally, one naming correction.** SD concerns: `wrinkle, pore, texture, acne, moisture, firmness, redness, oiliness, radiance, age_spot, dark_circle_v2, eye_bag, droopy eyelids, tear_trough, skin_type` — note it's `age_spot`, not `spots` as written in `SPEC.md.md` §4's `skinConditions` shape; update the type or map on ingestion. `score_info.json` has two shapes: flat `{raw_score, ui_score, output_mask_name}` for most concerns, and a nested-by-subregion form (whole face / T-zone / U-zone) for `texture, acne, pore, wrinkle, skin_type` — our flat `SkinConditionScore` type in `src/lib/types.ts` currently assumes every concern is flat; pick a subregion (whole face) when reading the nested ones. `all.score` and `skin_age` are confirmed top-level siblings, matching the spec.
   - Bonus finding: the `skin_type` concern classifies into **Normal/Oily/Dry/Combination, each ± Redness** (8 categories) — this is a real, usable "detect" path for the questionnaire's `skinType` field (`SPEC.md.md` §5 already allows "type fallback: detect"), not just a manual ask.

4. **`cloth` VTO — field names confirmed.** Request: `src_file_id`/`src_file_url` (user photo), `ref_file_id`/`ref_file_url` (outfit reference) or `template_id` as an alternative, `garment_category` (e.g. `"full_body"`). File API response nests the upload target as `requests: { url, method }`, not a flat `url` — `src/lib/youcam/client.ts` now reflects this. Task status field is **`task_status`**, not `status` (also fixed in the client — this was wrong in the original scaffold). Result image comes back as `results.url`. Error shape: `{ status, error, error_code }` (e.g. `InvalidAccessToken`).
   - Task status field name (`task_status`) was confirmed on both `cloth` and the facial-color-tones endpoint, so `src/lib/youcam/client.ts` treats it as universal across `/task/{feature}/{task_id}` — flag it if any feature turns out to differ.

5. **Makeup VTO existence** — still not confirmed (a `makeup_vto` reference page exists at docs.perfectcorp.com but its content didn't render past the title in this pass). Confirm your API tier includes it and pull its real request/response shape before committing to §6.3 rendering.

Item 2 is now the real blocker — it's a product decision (how do we get undertone/depth without a direct API field), not a lookup. Items 3–4 are resolved enough to build against; re-verify 3's nested score shape and 4's exact enum for `garment_category` once a live key is available.

---

## 7. Explicitly not building (§17)
Accounts/auth, real checkout, body measurement/size prediction, skin detection from body photo, medical diagnosis, large catalog, native app.
