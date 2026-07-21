# TrueHue — Design Doc
*Visual direction for Pencil mockups. Companion to `DEVELOPMENT.md` (screens, states) and `CONTENT.md` (copy, tone). Design must carry the same voice as the copy: warm, not clinical.*

---

## 1. Three words this has to feel like
**Soft. Warm. Confidential.** In that order of visual priority. This is a mobile app people use in a private moment (getting ready, alone, often insecure about how they look) — it should feel like a trusted friend's opinion, not a diagnostic tool or a shopping dashboard.

**The test for every screen:** if it could be mistaken for a lab report, a fitness-tracker severity gauge, or a generic e-commerce grid, it's wrong for this product — no matter how clean it looks. Softness and warmth aren't decoration here; they're doing the same job as the Trust-layer copy (`CONTENT.md` §1–2): making a skin scan feel safe instead of clinical.

---

## 2. What to actively avoid
- **Clinical/lab aesthetics:** stark white backgrounds, harsh saturated blues, red/yellow/green severity meters or gauges, grid-of-stats dashboards, sharp 0px-radius cards. All of this fights the empowering-language work already done in copy.
- **Generic e-commerce chrome:** dense product grids, star ratings, "sale" badges, countdown urgency banners — `CONTENT.md` §7 already rules this voice out in copy; the visuals shouldn't reintroduce it.
- **Camera/scan UI that reads like surveillance:** no crosshair-on-face targeting reticles, no harsh red recording dots, no exposed technical readouts (file size, resolution) during capture.

---

## 3. Visual language

### Color
Warm neutral base (think warm ivory/sand, not sterile white) with a soft accent rather than a saturated brand blue — the app's real color story is the user's *own* palette (§10 of SPEC.md.md), so the chrome should recede and let the four seasonal palettes (Spring/Summer/Autumn/Winter, §10) be the most saturated color on screen. Chrome competing with the result for color attention is a bug, not a style choice.
- Backgrounds: warm off-white / soft sand, not `#FFFFFF`.
- Primary text: warm dark neutral (soft charcoal, not pure black).
- Accent (CTAs, progress): one soft, warm accent color — muted rose or terracotta reads warm without skewing into any single seasonal palette, so it won't clash with a user's result later.
- Never use a red/yellow/green traffic-light system anywhere skin data appears — that's the single fastest way to make this feel clinical again.

### Shape & space
- Generous rounded corners on every container (cards, buttons, photo frames) — soft geometry reinforces "soft" as a literal shape language, not just a mood.
- Generous whitespace/padding, especially around the face/body capture steps — a cramped capture screen reads anxious, not safe.
- Soft drop shadows or none at all; avoid hard borders where a soft shadow or tonal background shift can separate sections instead.

### Typography
- One warm, rounded-terminal sans for UI (avoid geometric/technical-feeling faces — those read clinical).
- Clear size hierarchy but not loud: body copy should feel like it's being *said*, not *displayed*. The rationale (`CONTENT.md` §5) especially needs a slightly larger, more relaxed line-height — it's the emotional payoff line, give it room.

### Motion
- Soft ease-in-out transitions between screens, no hard cuts or snap transitions — this is the most direct lever for "warmth" as a felt quality, not just a look.
- The composing/staged-loading screen (`CONTENT.md` §3) should animate each status line in gently (fade/slide, not a jump-cut list) — it's doing double duty as reassurance *and* product education, so it shouldn't feel rushed.
- Capture confirmation (face/body photo accepted) deserves a soft, brief affirming animation — small moment, but it's a trust checkpoint.

---

## 4. Confidentiality, made visible
Privacy can't only live in copy (`CONTENT.md` body-capture reassurance line) — it needs a visual signal too, since this is the highest-anxiety step in the flow.
- A subtle, persistent privacy cue near both capture screens (small lock/shield glyph + the reassurance copy together, not copy alone).
- No visible "uploading to server" language or progress bar that exposes technical process — show the *staged status text* (`CONTENT.md` §3) instead, which narrates progress without making the user think about servers holding their photo.
- Never show a thumbnail gallery or "your photos" library screen — photos should feel like they pass through, not accumulate. Reinforces the "not stored" claim visually, not just in copy.

---

## 5. Mobile-first rules (this is a phone app, design it as one)
- **One primary action per screen**, thumb-reachable — anchor the main CTA near the bottom of the viewport, not top or mid-screen.
- **Single-column, no side-by-side choices** that require precise tapping — questionnaire chips (`CONTENT.md` §3) should be large, stacked or wrapped, never a dense multi-column grid.
- **Tap targets ≥44px**, generous spacing between them — this is a soft/warm product, cramped controls contradict that immediately.
- **Progress indicator across the whole flow** (step X of Y, or a soft progress bar) so the multi-screen journey (occasion → face → questions → body → composing → look) never feels open-ended, especially on the body-capture step where anxiety is highest.
- **Camera/upload controls sized for one-handed use** — assume the user is holding the phone, not propping it up.
- **The Look screen scrolls vertically, single column** — hero (outfit + rationale) first, shoppable rows below, never a side-scrolling carousel for the primary result (side-scroll is fine for secondary product alternatives only, if at all).

---

## 6. Screen-by-screen design intent
(Screens per `DEVELOPMENT.md` §4 — this is intent for Pencil mockups, not final pixel specs.)

| Screen | Design intent |
|---|---|
| Occasion entry | Feels like a warm opening question, not a form field. Large, single input, soft background, no visible "step 1 of 8" starkness yet — ease the user in. |
| Face capture | Calm, soft-lit visual framing; lighting guidance shown as gentle color/glow shift, not a red error state. |
| Analyzing / skin snapshot | First real Trust-layer visual moment — soft reveal animation, empowering-language cards (§2 of CONTENT.md) styled as warm, rounded, never table/grid-like. |
| Micro-questionnaire | Big, tappable chips; one question fully visible at a time, not a long scrolling form. |
| Body capture | Most reassurance-heavy screen — privacy cue + pose guide overlay rendered softly (translucent outline, not a stark tracking box). |
| Composing | Full-bleed, calm animated staged text; this is a *waiting room that feels good*, not a progress bar racing to 100%. |
| The Look | The visual climax — outfit hero image large and unhurried, rationale given real breathing room, shoppable rows visually quieter than the hero so the coordinated look stays the star. |
| Trust footer | Present but quiet — small type, soft tone, always visible, never dismissible-and-forgotten (it's a standing commitment, not a one-time disclaimer). |

---

## 7. Given the timeline
Time is short — don't design bespoke illustration or custom iconography from scratch. Use a single simple, soft/rounded icon set consistently (privacy glyph, chips, progress) rather than inventing new visual motifs per screen. Spend the design budget on: the capture screens (highest anxiety, most payoff from softness), the composing wait (cheap to make feel great, easy to get wrong), and the Look screen hero (this is what's in every demo screenshot and the video). Everything else can be simpler and still land.

---

## 8. Next step
This doc is the brief for Pencil mockups. Once mockups exist for the 8 screens above, they need sign-off before implementation starts (per the agreed plan: docs → Pencil design → approval → build).
