# Ensemble — Landing Page Plan
*Companion to `DEVELOPMENT.md` (stack/screens), `CONTENT.md` (voice), `DESIGN.md` (visual system). This is the page a cold visitor — a judge, a Devpost browser, anyone following the demo video link — sees before ever touching the actual app flow.*

---

## 1. Job this page has to do
Not a screen in the onboarding flow (§7 of `SPEC.md.md` starts *inside* the product, at occasion-entry). This is what sits in front of it: the elevator pitch, in the time it takes to scroll once, ending in exactly one action — start the flow.

**The test for this page:** someone who has never heard of Ensemble should understand the "one coordinated look, not two guesses" premise and the deletion-test differentiator (§1) before they scroll past the first screen's worth of content. Everything below the fold is reinforcement, not the pitch itself.

Lives at `/` in the Next.js app. The actual onboarding flow (occasion entry → … → Look screen) moves to its own route so the marketing page and the product don't fight for the same URL — e.g. `/get-ready` or `/start`, kicked off by this page's CTA. (Placeholder homepage currently at `src/app/page.tsx` gets replaced by this plan; the flow's first screen moves out to its own route.)

---

## 2. Section-by-section plan

### 2.1 Header
Minimal — logo mark only, no nav links. This isn't a multi-page marketing site with a menu to browse; it's a single scroll ending in one CTA. A nav bar with 4 links would dilute that. Optionally a single "How it works" anchor link if the page ends up long enough to need it.

### 2.2 Hero
- **Headline:** the one-line premise, adapted from `SPEC.md.md` §0/§8's product description. Something like: *"Getting ready is one decision, not two guesses."*
- **Subhead:** one sentence naming what happens — skin scan drives both the outfit color and the beauty finish, rendered on you.
- **CTA:** single button, verb-first per `CONTENT.md` §7 (e.g. "Get your look" — not "Get Started," which is generic). This is the only interactive element above the fold besides the logo.
- **Hero visual:** this is the one place a real product screenshot matters most — the Look screen (§13) hero (outfit + rationale), or a short looping clip of the reveal. If neither exists yet, a soft placeholder in the warm palette, never a stock photo of an unrelated model — the visual promise has to be *this exact product*, not generic fashion-tech imagery.

### 2.3 The problem (short, one or two lines)
Names the friction this replaces: deciding skin and outfit separately, and badly. Pull directly from the hackathon's own framing (Apparel VTO topic description: "will this fit, will this look right, is it worth the return") combined with the Skin AI topic framing (the moment right before a purchase or in front of a mirror) — this page should sound like it's answering the judges' own prompt back to them, because it is.

### 2.4 How Ensemble works
3–4 steps, visual not paragraph-heavy — this is a place `Motion` staggered-fade-in-on-scroll earns its keep (§DESIGN.md §3 motion principles: soft, never jarring).
1. Tell us the occasion.
2. Scan your face — skin state + undertone.
3. One photo, full outfit rendered on you.
4. Get one look: outfit, beauty, and why — coordinated.

Each step: a short label + one-line description, no jargon, matching the staged-status copy voice already established for the composing screen (`CONTENT.md` §3) — this section is a preview of that same voice.

### 2.5 The deletion test (the differentiator, stated plainly)
This is the paragraph aimed at judges specifically, even though real users benefit from it too: state the "if you deleted the skin scan, the outfit result gets worse" logic from `SPEC.md.md` §1 in plain language. Don't bury this — it's the single fact that separates Ensemble from the generic version of this idea (see earlier conversation on differentiation). Pair it with the two YouCam APIs named explicitly (Skin AI + Apparel VTO) — judges need to see the APIs named on the page itself, not just in the demo video.

### 2.6 Trust, stated once, visibly
One short block, not buried in a footer: the empowering-language commitment (§11) and the dignity-across-tone-range wedge (§2) — Ensemble's actual moat per earlier discussion. This is where "confidential/warm" as a design value becomes a stated product value, not just a vibe.

### 2.7 Final CTA
Repeat the single action from the hero, no new copy needed — a returning visitor scrolling to the bottom shouldn't hit a wall of links, just the same door back into the flow.

### 2.8 Footer
Small, quiet: cosmetic-not-medical line (`CONTENT.md` §4), YouCam API + hackathon credit, nothing else. No sitemap-style link farm — this isn't that kind of site.

---

## 3. Design intent
Same system as the app (`DESIGN.md`), not a separate marketing skin — a judge clicking from the hero into the actual flow should feel zero seam. Specifically:
- Warm ivory/sand background, generous whitespace, soft rounded corners — no landing-page clichés (no gradient-mesh hero background, no glassmorphism cards, no marketing-site stock icons).
- One accent color used sparingly (the CTA button, small emphasis marks) — chrome recedes, per `DESIGN.md` §3's color rule.
- Motion: soft fade/slide on scroll for the "how it works" steps, no parallax gimmicks, nothing that fights the "calm, trustworthy" read established for the capture screens.
- Mobile-first single column, exactly like the app — this page will mostly be opened on a phone from the demo video/Devpost link, not a desktop marketing browse session.

---

## 4. Build notes
- Route: `src/app/page.tsx` becomes this landing page; the onboarding flow's first screen (occasion entry) moves to its own route, e.g. `src/app/get-ready/page.tsx`.
- Components: shadcn `Button` for the CTA (already styled to the warm token set), Phosphor icons for the "how it works" step glyphs (small, single-weight, not decorative illustration — consistent with `DESIGN.md` §7's "don't invent new visual motifs" note), `motion` for scroll-triggered reveals on the how-it-works section only — don't animate every section, that reads busy rather than calm.
- No separate CMS/content file needed — copy is short and stable enough to live directly in the page component; wire it against `CONTENT.md` §1's voice rules when writing real copy, not the placeholder lines above.
- This page needs zero `LookProfile` state and no API calls — keep it a static/server component, no client-side JS beyond the scroll-triggered motion and the CTA link.

---

## 5. Explicitly not on this page
No pricing (there isn't any), no testimonials (nothing to show yet), no multi-page nav, no blog/about, no account/login anything — matches §17's "not building" list. This page's only job is pitch → one CTA.
