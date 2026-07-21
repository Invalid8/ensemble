# TrueHue — Content Doc
*Copy and voice guidelines for every string in the product. Companion to `SPEC.md.md` (Trust layer: §11) and `DEVELOPMENT.md`. If a screen's copy isn't covered here, write it to match the principles below, don't improvise a different voice.*

---

## 1. Voice, in one line
**Warm, specific, and honest — never clinical, never alarming, never vague.** TrueHue talks like a friend who's good with color, not a dermatologist and not a hype-man. It names real things (a color, a garment, an occasion) instead of generic praise ("you look great!").

Three tests for any string before it ships:
1. **Would a dermatology chart word this way?** If yes, rewrite it (see banned words, §2).
2. **Does it lead with a strength before naming a focus area?** If it opens negative, reorder it.
3. **Is it specific to this user's actual result**, or could it paste onto anyone's screen unchanged? Generic copy undercuts the whole "coordinated to *you*" premise.

---

## 2. Empowering language remap (mandatory — §11 of SPEC.md.md)

Never show raw clinical severity. Reframe as a focus area, always leading with a strength.

| Never say | Say instead |
|---|---|
| Pore Severity: High | Hydration & pore focus area |
| Wrinkles: Severe | Areas to nourish & protect |
| Redness: High | Calming focus |
| Oiliness: High *(pattern-consistent example)* | Shine & oil-balance focus |
| Texture: Rough *(pattern-consistent example)* | Smoothing focus |

**Banned words, full stop:** severity, flaw, problem, damage, poor. If a word feels like it belongs on a lab report, it doesn't belong on this screen.

**Rules:**
- Cap displayed focus areas at **3**, even if the API returns more.
- A low overall score is never shown as a scary number. Always frame as "where your skin's thriving" + 1–2 focus areas — never a single downward-trending stat with nothing to balance it.
- When in doubt, name the *action* (moisturize, calm, brighten) rather than the *condition* being corrected.

---

## 3. Screen-by-screen copy

### Occasion entry
Frame as one act of getting ready, not a form. Example: *"Let's get you ready — what for?"* Not: "Select your occasion." Keep it conversational, second person, low-friction (one line, then done).

### Face capture — lighting check
Live, directional, never a flat failure. Bad: *"Lighting insufficient."* Good: *"A little more light will help — try facing a window."* The user should always know what to *do*, never just that something's *wrong*.

### Analyzing / skin snapshot
This is the first Trust-layer moment — get it right. Lead with the empowering remap (§2), never show the wait as dead time: pair with staged status copy (see §6).

### Micro-questionnaire
Tap-only, no essays. Question phrasing should sound like it's building *toward* the look, not interrogating the user: *"What's your skin like day to day?"* not "Select skin type."

### Body capture
This is the highest-anxiety step — copy has to do real reassurance work, not just instruct.
- Reassurance line (always visible near the upload control): *"Used only to show the outfit on you — never stored, never shared."*
- Guide copy: show, don't just tell — pair short instruction text with the pose-guide overlay/example thumbnail (§4 of DEVELOPMENT.md), e.g. *"Stand where we can see your full outfit."*

### Composing (wait state)
Never a bare spinner. Staged status text that narrates the actual coordination happening — this doubles as product education:
- *"Reading your skin tone…"*
- *"Choosing your palette…"*
- *"Matching your outfit and beauty…"*
- *"Putting your look together…"*

### The Look screen
- **Title:** `"Your look for {occasion}."` — always fill in the real occasion, never a fallback like "your event."
- **Rationale** (§6.4 template, see §5 below) is the emotional payoff of the whole flow — it should read as one sentence a stylist would actually say out loud, not a report.
- **Trust footer** (always present, exact wording anchored below): cosmetic-not-medical note + simplified-engine note.
- **Share card copy:** short and personal — *"My look for {occasion}, by TrueHue."* Not a marketing tagline.

---

## 4. Required disclaimers — exact wording anchors

These are non-negotiable, must appear verbatim (or near-verbatim, minor tense adjustment only) wherever skin health or the color engine is shown:

- **Cosmetic-not-medical:** *"This is cosmetic guidance, not medical advice. If something's concerning you, a dermatologist can help."*
- **Simplified engine note** (near the color season result): *"A simplified color match, not a professional color session."*
- **Safety-flag trigger** (§9 — shown whenever a safety flag is set): *"We've adjusted these picks for you — always check with a professional before starting new active ingredients."*

Never soften these into vague "consult a doctor" boilerplate — they need to acknowledge that a real adjustment happened (§9), not just cover legally.

---

## 5. Rationale generator — voice + template

The rationale (§6.4) is the single most important piece of copy in the product — it's what makes the skin→outfit→beauty dependency *audible*, and it's what gets read aloud in the demo (§23). It must always:
- Name the real values from this user's `CompleteLook` — never a placeholder-sounding sentence.
- Move in one direction: skin fact → color choice → why → beauty finish → occasion. Don't reorder or skip a link in the chain, or the "one coordinated look" premise stops being visible.
- Stay to 2–3 sentences. Longer reads as a report, not a stylist's voice.

Template:
> "You're **{undertone}**-toned with some **{topConcern}**, so we chose this **{nearFaceColor} {garment}** — shown on you — which flatters your colouring and calms it. To finish: a **{base finish}** base for your **{skin state}** skin, a **{lip}** lip that ties to the {garment}, all shade-matched to you — ready for **{occasion}**."

Worked example: *"You're cool-toned with a little cheek redness, so we chose this emerald top (shown on you) — it calms redness where warm corals would amplify it. Finish with a hydrating base for your dry skin and a cool-rose lip that ties to the top, shade-matched to you — ready for tonight's dinner."*

---

## 6. Terminology guard (§5 — keep both, name both, never conflate)
- **Color season** = which colors suit *you* (derived from skin: undertone + depth). Always paired with skin language when introduced ("based on your skin tone…").
- **Climate season** = garment weight/type for *the weather* (derived from country + date). Always paired with weather/location language when introduced ("for the weather where you are…").

Never use "season" unqualified in UI copy — always "color season" or "climate season" explicitly, even if it reads slightly more formal. Ambiguity here undercuts the "two systems working together" story.

---

## 7. Microcopy conventions
- **CTAs:** verb-first, specific to the action, never generic. "Shop this top" not "Buy now." "Scan your face" not "Continue."
- **Errors:** always paired with a next action, never a bare failure state. "That photo's a little dark — let's try again" not "Upload failed."
- **Loading:** always staged/narrated per screen (§3), never a bare spinner with no text.
- **Affiliate links:** no special "ad" framing needed in copy, but never write false urgency ("only 2 left!", "selling fast") — that's a different product's voice, not this one's.

## 8. Never say
- Anything implying diagnosis, cause, or treatment ("you have," "this means you're," "caused by") — skin output is state, never cause (§3 of SPEC.md.md capability boundaries).
- Anything about body size/shape as measured fact — VTO visually adapts garments; size/shape come from the questionnaire, not detected. Never phrase results as if the API measured the user's body.
- The banned words in §2, anywhere, including in error states or dev-visible debug copy that could leak into a screenshot.
