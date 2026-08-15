# Submission pack

Everything the submission form needs, ready to paste. Derived from `SPEC.md.md` §0.1, §18, §21, §23.

---

## 1. Written description (paste into the form)

**Ensemble is an AI sales associate that fuses Skin AI and Apparel VTO into one decision engine — coordinated looks that grow baskets and cut returns.**

Ensemble answers one question — "How do I put myself together today?" — by treating skin and clothing as one styled look, not two shopping trips. The user names the occasion, scans their face, uploads a full-body photo, and gets back a single coordinated look: an outfit rendered on their own body, plus the makeup and skincare that finish that exact look, plus one unified explanation tying it all together.

**Why wouldn't a retailer just embed Perfect Corp's Skin AI and VTO widgets separately?**

Because the widgets can't talk to each other. Perfect Corp sells *capabilities*; Ensemble is the **decision layer** between them — near-face colour rules, safety suppression, shade-matching, one rationale.

**The deletion test.** The combined-track brief asks whether removing the Skin AI half would visibly degrade the Apparel half. For Ensemble the answer is yes, catastrophically: without the skin scan there is no undertone, so no seasonal palette, so no near-face colour logic, so no shade-matched makeup and no skin-state skincare. The look collapses into a generic clothes render. The two APIs are load-bearing for a single output, and that interdependence is the product.

You can watch this happen in the app itself. Every item on the final screen carries a "Why This Look?" checkmark tagged with the API output that drove it — so the dependency isn't a claim in a pitch deck, it's visible in the UI.

**YouCam APIs used**

- `skin-tone-analysis` — returns skin colour, from which we derive undertone and depth (Lab/ITA°) and select a seasonal colour palette.
- `skin-analysis` — HD concern scores (redness, oiliness, moisture, radiance, age spots, texture, skin type) that drive near-face colour constraints, skincare prep, and makeup base finish.
- `cloth` (Apparel VTO) — renders the chosen outfit on the user's own body photo, chaining a top and a bottom into one full-outfit render where the look isn't a single dress.

**How the fusion actually works**

1. Undertone and depth from the tone API select a colour season and palette.
2. Skin-analysis concern scores constrain which palette colours may sit near the face — visible redness pushes cool colours forward, because warm corals amplify it.
3. The garment is chosen from that constrained palette, then rendered on the user via Apparel VTO.
4. Makeup coordinates to *both* the garment colour and the skin read: lip and blush harmonize with the near-face colour, base finish follows the moisture and oiliness scores, and the shade matches the depth from the scan.
5. Safety answers (pregnancy, sensitivity, allergies) suppress actives from the skincare and makeup output before anything is shown.
6. A rationale generator emits the same reasoning twice — a narrative paragraph for emotion, and a sourced checklist for trust.

**Trust layer**

Skin output is cosmetic guidance, never medical. Scores are remapped into empowering language, focus areas are capped at three, and banned framing (severity, flaw, problem, damage) never reaches the screen. The app reports skin *state*, never cause, and pairs any skin-health surface with a "see a professional" note. This is an ethical position and a commercial one: a tool that refuses to pathologize skin is the reason the retail metrics move.

**Retail KPI map**

| Ensemble feature | Retailer metric |
|---|---|
| Skin-aware outfit recommendations | Conversion rate |
| One coordinated look (apparel + beauty) | Average basket size / cross-sell |
| Undertone-accurate colour + shade matching | Fewer returns |
| "Why This Look?" transparent reasoning | Trust → completion rate |
| Occasion-first personalized journey | Engagement / session depth |

**Where this goes.** Every item is an affiliate link today (Impact, Rakuten, CJ), monetizing the confidence the look creates. The same composer white-labels as an embedded AI sales associate for beauty and fashion retailers — SaaS plus rev-share, sold on the KPI map above. The consumer app is the proof; the retailer integration is the business.

**Deliberate strength: accuracy and dignity across the full tone range**, especially medium-to-deep tones — the segment incumbents fail, and the market we build from.

**Tech.** Next.js 16 (App Router) and React 19, TypeScript, Tailwind 4. All YouCam calls run server-side through a proxy route so API keys never reach the browser, with exponential backoff on 429 and the universal 4-step workflow (file → PUT → task → poll). Client-side image compression before upload. Optional Postgres response cache via Drizzle that fails open, plus a per-visitor usage cap so a shared demo key cannot be drained. Catalog is a 136-product snapshot across both wardrobes (Sephora + ASOS via RapidAPI, ingested once to local JSON — the demo never calls RapidAPI live).

---

## 2. Demo video script (target 2:30, hard cap 3:00)

Judges may stop watching at 3:00, so the payoff is front-loaded. Name the APIs aloud where marked.

**0:00–0:20 — Hook.**
> "Getting ready means two guesses: will this suit my skin, and will this outfit look right on me. Ensemble makes them one decision."

On screen: landing page, then tap into the studio. State the occasion out loud — "dinner tonight."

**0:20–0:55 — Face.**
Lighting check passes → scan runs. Show the skin read.
> "That's YouCam's **skin-tone-analysis** and **skin-analysis** APIs. Notice how it talks about my skin — strengths first, no 'severity', no 'flaw'. And it's accurate on my depth, which is where most tools fall down."

**0:55–1:25 — Body and questions.**
Upload the body photo, answer size and fit quickly. Keep this brisk; it is the least interesting stretch.

**1:25–2:30 — The reveal.** This is the segment that wins or loses it. Slow down.
Show the Look screen. Read the rationale aloud so the dependency is *audible*:
> "Because it saw redness, it chose cool emerald — and a cool-rose lip to tie back to it."

Then point at the checkmarks:
> "Every checkmark here is an API output driving a decision. This is YouCam's **Apparel VTO** — the outfit rendered on my actual body."

**2:30–3:00 — Close.**
Tap a shoppable link. Then pivot:
> "For a retailer, this is an AI sales associate — bigger baskets, fewer returns, because the colour was right the first time. And take the skin scan away, and the whole look falls apart. That's the point."

**Before you hit record**
- **Set `YOUCAM_LOOK_LIMIT=0` in `.env.local` and restart.** The app caps visitors at 3 looks per 12 hours to protect the unit pool, and a dry run plus retakes will blow through that. Put it back to `3` before you share the deployed link.
- Do a full dry run first, timed. The reveal at 1:25 is where this is won or lost.

**Recording rules**
- Must show it functioning on-device (screen recording of the real app, not a mockup reel).
- Royalty-free audio only.
- No third-party trademarks in frame — check the catalog product cards before recording and avoid lingering on brand logos.
- Public on YouTube (preferred), link on the submission form.

---

## 3. Screenshot checklist

Capture at phone width (the app is mobile-first). Five is enough:

1. Landing page hero.
2. Occasion entry.
3. Skin snapshot — the empowering-language read.
4. The Look screen, full — hero VTO render plus rationale.
5. The Look screen, scrolled — "Why This Look?" checklist plus shoppable rows.

---

## 4. Pre-submit checklist

- [ ] Repo public with LICENSE — github.com/KrownWealth/ensemble ✅ public, MIT added
- [ ] README has run instructions and API-key setup (judges will try to run it)
- [ ] `npm run lint` and `npm run build` both clean
- [ ] Live-mode walkthrough on a phone, including a medium-to-deep tone photo
- [ ] Demo video recorded, edited, uploaded, public
- [ ] Written description pasted into the form
- [ ] Screenshots attached
- [ ] Submit early — do not wait for Aug 17
