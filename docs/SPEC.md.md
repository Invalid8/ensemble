# Ensemble — Implementation Spec v2 (Level 3: One Unified Look)
*(working name — change freely)*
**YouCam API Skin AI + Apparel VTO Hackathon · Combined track · Deadline: Aug 17, 2026**
**Supersedes v1. Single source of truth. If a decision isn't here, it isn't decided.**

---

## 0. The product in one paragraph
Ensemble answers one question — **"How do I put myself together today?"** — by treating skin and clothing as **one styled look, not two shopping trips.** The user tells us the occasion, scans their face, uploads a full-body photo, and gets back a **single coordinated "look"**: an outfit rendered on their own body (Apparel VTO), plus the makeup and skincare that finish *that exact look*, plus one unified explanation tying it all together. The skin analysis visibly drives both halves — the colours the clothes are chosen in, and the beauty products that match. Wrapped in a **Trust layer** that refuses to pathologize skin, and monetized by affiliate links on every item.

## 1. The thesis + the test we must pass
The combined-track judges reject "two separate features." Their test, in plain terms:
> **If you deleted the Skin AI half, would the Apparel half get visibly worse?**

For Ensemble the answer is **yes, catastrophically**: without the skin scan there is no undertone → no palette → no near-face colour logic → no shade-matched makeup → no skin-state skincare → the "look" collapses into a generic clothes render. **The two APIs are load-bearing for a single output.** That interdependence *is* the product, and §6 (the Look Composer) is where it lives. Everything else serves it.

## 2. Target user & wedge
Online shoppers (primarily women 18–40) getting ready for real moments — a date, an interview, an event — who currently make skin and outfit decisions separately and badly. **Deliberate strength: accuracy and dignity across the full tone range, especially medium-to-deep** — the segment incumbents fail, and the local (Lagos / West Africa) market.

## 3. Honest capability boundaries (never cross these)
- API analyzes a **photo, not physical skin** — no touch/palpation/"feel."
- Reports skin **state, never cause** — no hormones, allergies, conditions, treatments. Never diagnose.
- Does **not return body shape or size** as data. VTO only *visually adapts* garments. → shape/size come from the questionnaire.
- **Tone/undertone needs a clear face image** — never derive tone from the tiny face in a body shot.
- All skin output is **cosmetic guidance, not medical advice** — show a "see a professional" note wherever skin health appears.

---

## 4. The unified data model (the "one brain")
Both capture flows write into **one object**, and the Look Composer reads from it. This shared object is literally what makes it one product.

```ts
LookProfile {
  // — from face scan (Skin AI) —
  undertone: "warm" | "cool" | "neutral"
  tone: string; fitzpatrick: number            // for beauty shade-matching
  colorSeason: "Spring"|"Summer"|"Autumn"|"Winter"
  palette: Hex[]; avoidColors: Hex[]
  skinConditions: {                            // raw_score for logic, ui_score for display
    redness, oiliness, moisture, radiance, spots, texture: {ui:number, raw:number}
  }
  skinFocusAreas: string[]                      // empowering-language mapped (Trust layer)

  // — from questionnaire —
  skinType: "oily"|"dry"|"combo"|"sensitive"
  skinGoals: string[]                           // 1–2
  safetyFlags: { pregnant, breastfeeding, sensitivities, activeTreatment, allergies }
  bodyShape: "hourglass"|"pear"|"apple"|"rectangle"|"invTriangle"
  size: string; fitPref: "fitted"|"regular"|"relaxed"
  occasion: string                              // the context that makes it a "look"

  // — derived —
  country: string; climateSeason: string        // from country + date
}
```

The Composer outputs:
```ts
CompleteLook {
  occasion: string
  outfit:  { garments: Garment[], paletteUsed: Hex[], nearFaceColor: Hex }  // VTO-rendered on user
  beauty:  { skincarePrep: Product[], makeup: Product[] }                    // coordinated to skin + outfit
  rationale: string   // one narrative weaving skin → colours → outfit → beauty → occasion
}
```

---

## 5. Detect / Ask / Derive
| Data | Source | Feeds |
|---|---|---|
| Tone, undertone, Fitzpatrick | **Detect** — `skin-tone-analysis` (face) | palette + **beauty shade-match** |
| Skin conditions (redness, oiliness, moisture, radiance, spots, texture) | **Detect** — `skin-analysis` (face) | near-face colour filter + skincare prep + makeup finish |
| Body pose / drape | **Detect** — `cloth` VTO | render only |
| (Reach) makeup render on face | **Detect** — makeup VTO (confirm endpoint) | the "finished look" visual |
| Skin type, goals | **Ask** (type fallback: detect) | skincare + fabric |
| Safety flags | **Ask** | suppress unsafe recs (§9) |
| Body shape, size, fit | **Ask** | silhouette ranking + size filter |
| Occasion | **Ask (first)** | frames the whole look |
| Country | **Ask** | climate season |
| Climate season | **Derive** — country + date | garment type/weight + skincare |
| Colour season → palette | **Derive** — undertone + depth | outfit + makeup colours |

**Terminology guard:** *colour season* = which colours suit you (from skin). *climate season* = garment type/weight for the weather (from country+date). Keep both, name both.

---

## 6. The Look Composer — coordination engine (THE core of Level 3)
This is where "both APIs work as one." Rules run in order; each downstream choice depends on an upstream skin fact.

### 6.1 Outfit colour — the near-face rule
Necklines sit by the face, so **near-face garment colour is filtered by skin *condition*, not just palette.** Lower-body pieces get the looser palette-only filter.
- Base set = `palette` (from undertone). Remove `avoidColors`.
- Then apply skin-condition overrides to the **near-face** garment (top/dress bodice):
  - `redness` high → drop warm reds/corals/oranges near face (amplify redness); prefer cool blue/green/teal (neutralize).
  - `radiance` low / sallow → drop muddy yellow/olive near face; prefer clearer, brighter picks in-palette.
  - `spots`/uneven → avoid high-contrast busy prints near face; prefer solid, even tones.
- Output `nearFaceColor` = the chosen top colour. This becomes an input to makeup (6.3).

### 6.2 Skincare prep — skin state × climate × safety
- `moisture` low OR cool/harmattan climate → hydrating serum + richer moisturizer (occlusive in harmattan).
- `oiliness` high OR hot/humid climate → lightweight gel, oil control.
- `redness` high → soothing (centella, niacinamide).
- `spots`/uneven goal → brightening (vitamin C, azelaic, niacinamide).
- Always append SPF as good practice.
- **Then run §9 safety suppression** over the result (pregnancy, sensitivity, allergies remove/replace actives).

### 6.3 Makeup — coordinated to BOTH outfit colour AND skin (the visible fusion)
This is the step judges will look for: makeup depends on the garment, which depends on the skin.
- **Lip/blush harmonize with `nearFaceColor`:** cool jewel top (emerald/sapphire) → cool berry/rose; warm top (rust/mustard) → terracotta/brick; neutral top → flex to undertone.
- **Base finish from skin state:** dry → dewy/hydrating; oily → matte; combo → natural. Redness → mention colour-correcting (green) primer.
- **Shade-match to `tone`/`fitzpatrick`** from the scan (concealer/base shade) — a direct skin→beauty link, and our deep-tone accuracy showcase.
- Undertone biases neutrals (warm → peach/gold; cool → rose/mauve) unless the outfit dictates otherwise.

### 6.4 Rationale generator (one unified narrative)
Template weaves the chain so the user *sees* one capability feeding the other:
> "You're **{undertone}**-toned with some **{topConcern}**, so we chose this **{nearFaceColor} {garment}** — shown on you — which flatters your colouring and calms it. To finish: a **{base finish}** base for your **{skin state}** skin, a **{lip}** lip that ties to the {garment}, all shade-matched to you — ready for **{occasion}**."

Example: "You're cool-toned with a little cheek redness, so we chose this emerald top (shown on you) — it calms redness where warm corals would amplify it. Finish with a hydrating base for your dry skin and a cool-rose lip that ties to the top, shade-matched to you — ready for tonight's dinner."

---

## 7. End-to-end flow (one converging experience)
1. **Occasion-first entry:** "Let's get you ready — what for?" → occasion (+ country if unknown). Frames it as *one act of getting ready*, not two scans.
2. **Face step:** lighting pre-check → selfie (one upload → two skin tasks) → skin-tone + skin-analysis.
3. **Micro-questionnaire:** skin type, 1–2 goals, safety flags.
4. **Body step:** full-body upload + body shape / size / fit.
5. **Composer runs** (§6) → `CompleteLook`.
6. **The Look screen** (§13): outfit on user + coordinated beauty + unified rationale + shoppable links (+ reach: makeup VTO on the selfie, shareable look card).

---

## 8. API data contract (condensed)
- **Base URL:** `https://yce-api-01.makeupar.com` · **Auth:** header `Authorization: Bearer <key>` (V2)
- **Universal 4-step workflow** per feature: `POST /s2s/v2.0/file/{feature}` (get file_id + upload URL) → **`PUT` bytes to that URL** → `POST /s2s/v2.0/task/{feature}` (get task_id) → `GET /s2s/v2.0/task/{feature}/{task_id}` (poll to success). Units charged on success only.
- **skin-analysis:** `{src_file_id, dst_actions:[...], format:"json"}`. **SD or HD, never mixed.** Returns per-concern `ui_score`+`raw_score` (higher=healthier), `all.score`, `skin_age`. SD ≈ 9–12 units.
- **skin-tone-analysis:** tone + undertone + Fitzpatrick + eye/lip/hair colours. ⚠️ **field names UNCONFIRMED.**
- **cloth (VTO):** single full/half-body photo; pose-detect; `garment_category` (`auto`), `change_shoes`. ⚠️ **field names UNCONFIRMED.**
- **makeup VTO (reach):** ⚠️ **confirm this feature exists in the API tier + its endpoint/params** before committing to §6.3 rendering.
- **Limits:** 250 req/300s, 5 QPS (per key AND IP) → backoff on 429. Uploads/results purged 24h; download links ~2h → process live. **Parse with `json-bigint`** (IDs > 2^53).
- **Budget:** 1,000 free units — cap calls, no loops, SD not HD, one selfie → two skin tasks.

## 9. Safety override logic (cosmetic, not medical)
Answers **suppress** recommendations. Demo-grade; always pair with "see a professional."
- Pregnant/breastfeeding → suppress retinoids, hydroquinone, high-dose salicylic; prefer azelaic, niacinamide, gentle hydrators.
- Sensitive / compromised barrier / active treatment → suppress strong AHA/BHA + retinoids; prefer ceramides, panthenol.
- Stated allergy → best-effort ingredient filter; if unsure, omit.
- Any flag → visible "cosmetic guidance; see a professional" line.

## 10. Colour-season + climate logic
**Season engine (simplified 4-season):** undertone × depth → season → palette + avoid list.
- Warm+light/med,soft → *Spring* (coral #FF7F50, peach #FFDAB9, warm green #9ACD32, gold #FFC300, camel #C19A6B)
- Warm+med/deep,muted → *Autumn* (rust #B7410E, olive #808000, mustard #E1AD01, terracotta #E2725B, cream #FFFDD0)
- Cool+light/med,soft → *Summer* (soft blue #A9C1D9, lavender #B57EDC, rose #C08081, dusty pink #D8A7B1, slate #708090)
- Cool+med/deep,clear → *Winter* (true red #BF0A30, emerald #046307, royal blue #002366, fuchsia #C154C1, black/white)
- Neutral → nudge to nearest. *(UI note: simplified engine, not a pro session.)*

**Climate season:** hemisphere from country → month → season; **tropical special-case**: Nigeria wet ~Apr–Oct, dry/harmattan ~Nov–Mar → recommend lightweight breathable pieces year-round, occlusive skincare in harmattan. Affects garment **type/weight** + skincare, not colour.

## 11. Trust layer (the moat — cross-cutting, mandatory)
1. **Empowering language remap** — never clinical severity; lead with a strength. "Pore Severity: High"→"Hydration & pore focus area"; "Wrinkles: Severe"→"Areas to nourish & protect"; "Redness: High"→"Calming focus". Low overall score → never a scary number; show "where your skin's thriving + 1–2 focus areas." Cap focus areas at 3. Banned words: severity, flaw, problem, damage, poor.
2. **Safety override** (§9).
3. **Lighting pre-check** — sample frame brightness; block shutter until adequate; on-screen guide. Fixes score-swing.
4. **Honest try-on framing** — VTO shows *colour & silhouette on you*, not exact fit. Show `material`+size-chart from catalog ("100% linen, relaxed fit"). Address "floating garment" via expectation-setting.

## 12. Catalog & data (RapidAPI)
Two product types now — **apparel** and **beauty** — normalized to:
```json
{ "id":"", "type":"apparel|beauty", "brand":"", "name":"", "category":"", "subcategory":"",
  "colors":[{"name":"","hex":""}], "primary_color_hex":"", "sizes":[], "material":"", "fit":"",
  "shade":"", "finish":"", "key_ingredients":[],           // beauty fields
  "price":0, "currency":"", "image_url":"", "product_url":"(affiliate)", "occasion_tags":[] }
```
Map `primary_color_hex` → nearest palette colour (RGB/LAB, ΔE if easy). Curate ~20–40 apparel (span the wheel) + ~15–20 beauty (bases across shades, a few lips per temperature, core skincare) so every profile resolves to a complete look. Hide missing fields, never fabricate.

## 13. The unified "Look" screen (the winning artifact — spec it carefully)
- **Hero:** the user wearing the outfit (VTO). If makeup VTO built → a face inset showing the coordinated makeup; else makeup shown as shade swatches.
- **Title:** "Your look for {occasion}."
- **Unified rationale** (§6.4) — 2–3 sentences, skin→outfit→beauty→occasion.
- **Shoppable rows:** *Outfit* (each with material/fit chip + affiliate) · *Beauty* (skincare prep + makeup, shade-matched, safety-filtered, affiliate).
- **Trust footer:** cosmetic-not-medical note + "simplified engine" note.
- **Share:** "Look card" (outfit + palette + finish) → viral loop.

## 14. Monetization
Every try-on-verified item (apparel **and** beauty) is an affiliate link — monetizing the confidence the look creates. Demo uses RapidAPI data; pitch names affiliate networks (Impact, Rakuten, CJ) + the returns-reduction value story.

## 15. Tech stack & architecture
React/Next.js, mobile-first. Next.js API routes / serverless as a **proxy** holding YouCam + RapidAPI keys (never client-side). `json-bigint` for YouCam responses. Client-side image compression pre-PUT; lighting check first. Polling with exponential backoff (respect 5 QPS). In-app React state only (no persistence needed). One `LookProfile` object threaded through the app.

## 16. Screens
Occasion entry → Face: lighting check → capture → analyzing → (brief) skin snapshot → micro-questionnaire → Body: upload + questions → composing → **The Look** → (reach) share card.

## 17. Scope (marked for shippability)
**Level 3 MUST (core winning experience):** occasion-first entry; face scan (2 skin APIs); questionnaire + safety; body VTO; **Look Composer** producing coordinated outfit colour + beauty **product recs** + unified rationale on **one** screen; shoppable affiliate (apparel + beauty); Trust layer; lighting check.
**Level 3 REACH (intensifiers, big judge points):** **makeup VTO** rendering the coordinated makeup on the selfie (3rd YouCam API — strongest proof of "one experience"); shareable look card; skin diary.
**FLOOR fallback (only if time collapses):** Level 2 — apparel with visible skin-driven "because" captions + beauty as text tips. Keep as safety net, don't plan for it.
**NOT building:** accounts/auth, real checkout, body measurement/size prediction, skin detection from body photo, medical diagnosis, huge catalog, native app.

## 18. Judging-criteria map
- **Tech Implementation:** 2–3 real YouCam APIs load-bearing for one output + coordination engine + safety logic + live catalog. Passes the deletion test.
- **Design:** one coherent "getting ready" experience converging on a single Look screen.
- **Potential Impact:** attacks separate-decision friction + returns cost; serves underserved tones; affiliate revenue on two product types.
- **Quality of Idea:** "getting ready as one act" maps to the judges' own words (skin + clothes = one self-image); a tool that refuses to pathologize skin = defensible identity.

## 19. Risks & mitigations
- Scope creep from Level 3 → the MUST/REACH split above; beauty half ships as *recs* first, makeup VTO only if schema confirmed + time allows.
- Anxiety/pathologizing → Trust layer (ethical + strategic).
- Lighting inconsistency → pre-capture check.
- Deep-tone VTO ashy/muddy → curate images, test on deep tones early, set expectations.
- VTO "floating"/fit → honest framing + metadata.
- API units → cap, SD, one upload→two tasks.
- Unconfirmed schemas → resolve first (§20).

## 20. Open dependencies (resolve before coding §6/§10)
1. `skin-tone-analysis` output fields (undertone/tone/Fitzpatrick keys) — drives palette **and** beauty shade-match.
2. `cloth` input/output fields (garment param, person param, result URL).
3. **makeup VTO** — does it exist in this API tier, and its endpoint/params? (Gates the REACH.)

## 21. Submission deliverables (mandatory — build alongside the product)
- **Code repo URL** — public (with license) OR private shared with contact_event@PerfectCorp.com; must contain all source, assets, and **run instructions (README with API-key setup)** — judges will try to run it.
- **Written description** — features, functionality, and the consumer/retail value case.
- **Screenshots** of the project.
- **1–3 min demo video** — front-load the payoff (judges may stop at 3:00); must **name the YouCam APIs used**; must show it **functioning on-device**; must be **public on YouTube** (preferred)/Vimeo/Youku with the link on the submission form; **no third-party trademarks or copyrighted music** (use royalty-free audio; be careful showing real brand logos in the catalog).
- **If we win:** exit interview + agree to a Perfect Corp blog feature.
- Prizes: **1st $5,000, 2nd $1,000**, 3rd–5th 5,000 units (~$275); top places also get a blog feature + product/dev marketing meeting.

## 22. Milestones (to Aug 17)
- **Wk1 — setup & plumbing:** register on Devpost → get redeem code; sign up YouCam API → redeem 1,000 units; **confirm §20 schemas** on the live account; build the proxy + 4-step workflow helper for one API; lighting check; define the `LookProfile` object.
- **Wk2 — face + brain:** tone→season engine, skin-analysis + empowering-language layer, questionnaire + safety override, occasion-first entry.
- **Wk3 — body + composer:** VTO + catalog (apparel + beauty), **Look Composer** (near-face colour rule, skincare prep, coordinated makeup, rationale generator), Look screen v1. **Start the demo script + repo README now.**
- **Wk4 — polish & submit:** finish Look screen; (reach) makeup VTO + look card; screenshots; record + edit demo (royalty-free music, no trademarks); write project description; finalize repo; submit early.

## 23. Demo arc (2–3 min, rewritten for the unified look)
1. **Hook (0:00–0:20):** "Getting ready means two guesses — will this suit my skin, and will this outfit look right. Ensemble makes them one decision." State the occasion ("dinner tonight").
2. **Face (0:20–0:55):** lighting check → scan → *kind* skin read (show empowering language + deep-tone accuracy beat). Name the Skin AI APIs.
3. **Body + questions (0:55–1:25):** upload, quick shape/size/occasion.
4. **The reveal (1:25–2:30):** the Look screen — outfit on the user, coordinated makeup, and read the unified rationale aloud so the *dependency is audible* ("because we saw redness, cool emerald — and a cool-rose lip to match it"). Name the VTO (+ makeup VTO) API.
5. **Close (2:30–3:00):** tap shoppable links; state the Trust-layer difference + returns-reduction + affiliate model. End on the deletion-test line: "take the skin scan away and the whole look falls apart — that's the point."
