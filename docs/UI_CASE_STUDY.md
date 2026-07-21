# Ensemble — UI Design Case Study
*How the visual identity was derived: the reference concept, the token system, and the research grounding it. Companion to `DESIGN.md` (the resulting rules) and `CONTENT.md` (the voice those rules serve) — this doc is the "why," those are the "what."*

---

## 1. The premise

Ensemble's whole product thesis is that skin and outfit are one decision, not two (`SPEC.md.md` §1), and that it works with dignity across the full skin-tone range — not just the tones incumbents already serve well (`SPEC.md.md` §2). The identity had to *feel* that thesis before a single screen loaded, not just state it in copy.

---

## 2. The reference concept

### 2.1 Starting point: a single flower
The visual direction started from a photo reference — a pink cosmos flower, warm-lit, soft petals radiating from a golden-yellow center (`design/ref/Pasted Image.png`). Not a literal asset (a photoreal flower doesn't survive being reduced to a 16px favicon), but a *structural and thematic* reference — a design schema, not clip art.

### 2.2 Why a flower, specifically
The reasoning behind the choice is the load-bearing part, not the flower itself: **an accessory like a flower flatters whoever wears it, regardless of their skin tone.** That's a direct visual echo of the product's actual differentiator — the "dignity across the full tone range" wedge — rendered as a felt quality instead of a stated one. A logo that only *looks* soft and warm would be decoration; one that encodes "this flatters everyone equally" in its own premise is doing the same work the product does.

### 2.3 The radiance connection
The mark isn't derived from the flower's outline — it's derived from its **radiance**: the abstracted light/glow quality of the reference, not a petal silhouette. This produces a real, non-decorative coincidence worth stating plainly: **`radiance` is one of the confirmed skin-analysis concerns** the product actually measures and improves (`redness, oiliness, moisture, radiance, spots, texture` — `DEVELOPMENT.md` §6 item 3). A mark built around radiance is a callback to a real mechanic in the product, not an arbitrary aesthetic choice. That's the detail that makes a design read as *authored* rather than templated — the "quality of idea" judging criterion working through the identity, not just the feature set.

### 2.4 The risk to manage in execution
Two adjacent genericness traps, both worth naming so execution can deliberately avoid them:
- **Floral marks are common in beauty branding already** — the differentiator has to survive contact with "yet another botanical logo." Leaning on *radiance* (light/glow) rather than *petal shape* (outline/silhouette) already pushes away from the most common version of this trap.
- **Soft-glow/radial marks are also a 2026 branding trend in their own right** — search results turned up multiple beauty brands independently converging on "soft radiant glow + clean rays extending outward" marks this year (see §5). That means the *direction* is validated as on-trend, but the specific execution needs a distinctive geometry (informed by the actual petal arrangement/ray count from the reference, not a generic radial gradient orb) to avoid collapsing into the same trend everyone else is also doing right now.

---

## 3. The token system

### 3.1 How the tokens were actually generated
Rather than hand-picking hex values, the base token set came from Pencil's AI-assisted style-archetype system: a fixed catalog of named color palettes, typography pairings, roundness, and elevation presets, queried and previewed before committing (`get_guidelines` with `category: style`). Several palettes were pulled and compared against the "soft, warm, confidential" brief before landing on **Warm Linen** — its surface, accent, and neutral values matched the warm-ivory/soft-terracotta direction almost exactly, with no manual color correction needed:

```yaml
surface.primary: "#F3EBE2"   # warm ivory/sand base
surface.secondary: "#C5BEB6" # warm neutral
foreground.primary: "#1A1A1A"
accent.primary: "#D4916E"    # soft terracotta
```

This is effectively the "AI token generation" workflow that's becoming standard practice industry-wide in 2026 (see §5) — generate from a constrained, pre-validated system rather than freehand-picking values, then verify contrast/legibility before adopting. The typography pairing (Newsreader for headings, Inter for body) and roundness/elevation presets (Basic Roundness, Soft Cloud) came from the same system, chosen for the same reason: calm, considered headline type and soft, non-clinical shadows.

### 3.2 The full token set (as implemented)
Living in `src/app/globals.css`:

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#f3ebe2` | Warm ivory base, not sterile white |
| `--color-surface-card` | `#faf6f0` | Card/panel surface |
| `--color-surface-2` | `#c5beb6` | Muted warm neutral |
| `--color-ink` | `#1a1a1a` | Primary text |
| `--color-ink-secondary` | `#3d3d3d` | Secondary text |
| `--color-ink-muted` | `#6b6b6b` | Tertiary/caption text |
| `--color-accent` | `#d4916e` | Soft terracotta — CTAs, focus rings |
| `--color-accent-soft` | `#e8cbb8` | Tinted accent — secondary surfaces, hover states |
| `--color-border-subtle` | `#dcd3c6` | Hairlines, input borders |
| `--color-success-calm` | `#8fa888` | Calm affirmative (privacy badge, confirmations) |
| `--radius` | `0.85rem` | Base corner radius — bumped up from Pencil's 0.625rem default for extra softness |
| `--font-heading` | Newsreader | Headlines, rationale text |
| `--font-body` | Inter | UI text, body copy |

### 3.3 Reconciling with shadcn/ui
shadcn's own Nova-preset theme ships a generic grayscale OKLCH palette plus its own semantic tokens (`--primary`, `--card`, `--muted`, `--ring`, etc.). Rather than maintaining two parallel token systems, every shadcn semantic token was remapped onto the table above (`--primary: var(--color-accent)`, `--background: var(--color-bg)`, etc.), so every generated component (Button, Dialog, Drawer, Select) inherits the warm palette automatically with zero per-component overrides. Contrast was checked by hand at this step: white text on `--color-accent` fails WCAG AA (~2.6:1), so `--primary-foreground` maps to `--color-ink` (~6.7:1) instead of white.

---

## 4. Design principles this produced
(Full rules in `DESIGN.md` — summarized here as the throughline from concept to system.)
- **Chrome recedes, the user's own palette is the star** — the four seasonal palettes (`SPEC.md.md` §10) are allowed to be more saturated than any UI chrome, because the actual color story belongs to the person's result, not the app shell.
- **No red/yellow/green severity signaling anywhere skin data appears** — a direct rejection of the "clinical dashboard" aesthetic, reinforced by the same warm-palette research below (§5.2) showing wellness apps trend toward pastel, non-alarming palettes for exactly this reason.
- **Soft geometry as literal shape language** — the bumped-up `0.85rem` base radius isn't decorative; it's the shape-level expression of the same "soft" test applied to color and motion.

---

## 5. Research grounding

### 5.1 Radiance/glow motifs in beauty branding (2026)
Beauty brand identity in 2026 is trending toward kinetic, motion-first systems and hand-crafted imperfection over sterile perfection, with soft-glow gradients specifically called out as a way to "signal authentic human creativity." Multiple beauty logos this year converge on "refined stars set within soft, radiant circular glows, with clean rays extending outward to evoke illumination and awakening" — validating the radiance direction as current, while confirming it needs a distinctive geometry to stand out from that same trend (§2.4).

### 5.2 Warm color psychology in wellness/beauty UI
Warm hues (orange, peach, cream) read as friendly, energetic, and approachable, while cooler palettes trend toward "calming and trustworthy" — wellness apps in this research specifically use soft pastel warm tones (peach, honey, cream) to create calming, non-clinical interfaces, which is the exact effect `DESIGN.md`'s "soft/warm/confidential" brief was already aiming for independent of this research — good convergent validation of the direction chosen.

### 5.3 AI-assisted design token generation as standard practice
Search interest in AI design-token generation has grown roughly 900% over two years, with organizations reporting meaningful reductions in design inconsistency and improved workflow speed from adopting generate-then-verify token workflows (single source of truth, exported to platform-specific formats) rather than hand-authoring values from scratch. This matches the actual workflow used here: generate from Pencil's style-archetype system, verify contrast/fit, then hand-tune only where needed (the radius bump, the accent-foreground contrast fix) — a real, current practice, not a shortcut.

---

## 6. Open items
- The flower/radiance reference is a concept and token-derivation input, not a finished mark — the actual logo/app-icon geometry still needs to be executed (in Pencil) as a reduced, distinctive vector, informed by real petal/ray geometry rather than a generic radial gradient.
- Once a candidate mark exists, re-check it against §2.4's two genericness traps before treating it as final.
- Token set above is what's live in code today; if Pencil work in progress produces refinements (e.g. a tuned accent hue to match the final mark), update both `globals.css` and the table in §3.2 together so they don't drift.

---

## Sources
- [Design And Beauty Branding Trends in 2026 — Selfnamed](https://www.blog.selfnamed.com/design/design-branding-trends-2026)
- [8 design trends shaping brand identity in 2026 — Three Rooms](https://www.threerooms.com/blog/8-design-trends-shaping-brand-identity-in-2026)
- [Leveraging the Psychology of Color in UX Design for Health and Wellness Apps — UXmatters](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php)
- [Best 8 Mobile App Color Scheme Trends for 2026 — Envato Elements](https://elements.envato.com/learn/color-scheme-trends-in-mobile-app-design)
- [Design Tokens in 2026: Auto-Generate Them in Seconds — OneMinuteBranding](https://www.oneminutebranding.com/blog/design-tokens-2026)
- [Automating Design Systems with AI: 2026 Workflow Guide — Parallel](https://www.parallelhq.com/blog/automating-design-systems-with-ai)
- [Design Token Architecture 2026 — Timothy Graf](https://timgraf.com/ui/design-token-architecture-2026-the-strategic-blueprint-for-scalable-design-systems/)
