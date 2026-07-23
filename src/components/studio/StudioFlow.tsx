"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import catalogJson from "@/data/catalog.json";
import {
  composeLook,
  deriveUndertoneAndDepth,
  getClimateSeason,
  getColorSeason,
  getPaletteForSeason,
} from "@/lib/composer";
import type { CompleteLook, LookProfile, Product, SkinConditions } from "@/lib/types";

const catalog = catalogJson as Product[];

type Journey = "skin" | "apparel" | "both";

const OCCASIONS = ["dinner", "date", "interview", "office", "wedding-guest", "graduation", "vacation", "everyday"];
const BUDGETS: { value: NonNullable<LookProfile["budget"]>; label: string }[] = [
  { value: "value", label: "Save a little" },
  { value: "mid", label: "Balanced" },
  { value: "premium", label: "Treat myself" },
];
const COUNTRIES = ["Nigeria", "United States", "United Kingdom", "South Africa"];
const SKIN_TYPES: NonNullable<LookProfile["skinType"]>[] = ["oily", "dry", "combo", "sensitive"];
const SKIN_GOALS = ["even tone", "hydration boost", "calm redness", "brighter glow", "oil balance"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const FITS: NonNullable<LookProfile["fitPref"]>[] = ["fitted", "regular", "relaxed"];

// §11.1 empowering-language remap: never clinical severity, lead with strengths, ≤3 focus areas.
const FOCUS_LABELS: Record<string, string> = {
  redness: "calming focus",
  moisture: "hydration focus",
  spots: "tone-evening focus",
  radiance: "radiance boost",
  oiliness: "shine-balance focus",
  texture: "smoothing focus",
};
const STRENGTH_LABELS: Record<string, string> = {
  redness: "even, calm colour",
  moisture: "well-hydrated skin",
  spots: "even tone",
  radiance: "natural radiance",
  oiliness: "balanced oils",
  texture: "smooth texture",
};

type SlideId =
  | "greeting"
  | "occasion"
  | "budget"
  | "country"
  | "face"
  | "snapshot"
  | "skinType"
  | "goals"
  | "safety"
  | "body"
  | "sizing"
  | "composing"
  | "look";

function slidesFor(journey: Journey | null): SlideId[] {
  const base: SlideId[] = ["greeting", "occasion", "budget", "country", "face", "snapshot", "skinType", "goals", "safety"];
  const bodySlides: SlideId[] = ["body", "sizing"];
  return [...base, ...(journey === "skin" ? [] : bodySlides), "composing", "look"];
}

interface SkinRead {
  conditions: SkinConditions;
  focusAreas: string[];
  strengths: string[];
  detectedSkinType?: LookProfile["skinType"];
  mock: boolean;
}

function scoreOf(raw: unknown): { ui: number; raw: number } {
  const r = raw as { ui_score?: number; raw_score?: number } | undefined;
  return { ui: r?.ui_score ?? 75, raw: r?.raw_score ?? 0.75 };
}

async function postYouCam(feature: string, file: File, taskParams?: Record<string, unknown>) {
  const form = new FormData();
  form.append("file", file);
  if (taskParams) form.append("taskParams", JSON.stringify(taskParams));
  const res = await fetch(`/api/youcam/${feature}`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `${feature} failed`);
  return json;
}

// SPEC §11.3 lighting pre-check: average luma of the chosen frame, block until adequate.
async function checkBrightness(file: File): Promise<"ok" | "dark" | "blown"> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const scale = 64 / Math.max(bitmap.width, bitmap.height);
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "ok";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let luma = 0;
  for (let i = 0; i < data.length; i += 4) luma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  luma /= data.length / 4;
  if (luma < 60) return "dark";
  if (luma > 235) return "blown";
  return "ok";
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm transition-colors ${active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
        }`}
    >
      {children}
    </button>
  );
}

function BigChoice({ emoji, title, sub, onClick }: { emoji: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:border-neutral-900 hover:shadow-md"
    >
      <span className="text-2xl">{emoji}</span>
      <span>
        <span className="block text-sm font-semibold text-neutral-900">{title}</span>
        <span className="block text-xs text-neutral-500">{sub}</span>
      </span>
    </button>
  );
}

function Dora({ line, sub }: { line: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-amber-200 text-sm">🌸</span>
        <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">Dora</span>
      </div>
      <h1 className="text-xl font-semibold leading-snug text-neutral-900">{line}</h1>
      {sub && <p className="mt-1.5 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <a
      href={product.product_url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 hover:border-neutral-400"
    >
      {/* Plain <img>: remote catalog hosts aren't in next.config images allowlist; fine for the walking skeleton. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={product.image_url} alt={product.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">{product.name}</p>
        <p className="text-xs text-neutral-500">{product.brand}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {product.material && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{product.material}</span>}
          {product.fit && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{product.fit} fit</span>}
          {product.shade && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{product.shade}</span>}
          {product.finish && <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{product.finish}</span>}
        </div>
      </div>
      <p className="shrink-0 text-sm font-semibold text-neutral-900">${product.price}</p>
    </a>
  );
}

export default function StudioFlow() {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [slide, setSlide] = useState<SlideId>("greeting");
  const [direction, setDirection] = useState(1);
  const [profile, setProfile] = useState<LookProfile>({});
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [lighting, setLighting] = useState<"unchecked" | "checking" | "ok" | "dark" | "blown">("unchecked");
  const [analyzing, setAnalyzing] = useState(false);
  const [skinRead, setSkinRead] = useState<SkinRead | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);
  const [composeStatus, setComposeStatus] = useState("Reading your skin story…");
  const [look, setLook] = useState<CompleteLook | null>(null);
  const [vtoUrl, setVtoUrl] = useState<string | null>(null);
  const [vtoMock, setVtoMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composeStarted = useRef(false);

  const slides = useMemo(() => slidesFor(journey), [journey]);
  const index = slides.indexOf(slide);

  const set = (patch: Partial<LookProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const goTo = useCallback(
    (target: SlideId) => {
      setDirection(slides.indexOf(target) >= index ? 1 : -1);
      setSlide(target);
    },
    [slides, index]
  );

  const next = useCallback(() => {
    const upcoming = slides[index + 1];
    if (upcoming) {
      setDirection(1);
      setSlide(upcoming);
    }
  }, [slides, index]);

  const back = useCallback(() => {
    const previous = slides[index - 1];
    if (previous && slide !== "look" && slide !== "composing") {
      setDirection(-1);
      setSlide(previous);
    }
  }, [slides, index, slide]);

  // pick → tiny beat so the selection registers visually → slide on.
  const pickAndGo = (patch: Partial<LookProfile>) => {
    set(patch);
    setTimeout(next, 220);
  };

  const onFaceFile = async (file: File) => {
    setError(null);
    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
    setLighting("checking");
    const result = await checkBrightness(file);
    setLighting(result);
    if (result === "ok") void analyze(file); // no button — good light means we go.
  };

  const analyze = async (file: File) => {
    setAnalyzing(true);
    setError(null);
    try {
      const [tone, skin] = await Promise.all([
        postYouCam("skin-tone-analysis", file, { face_angle_strictness_level: "medium" }),
        postYouCam("skin-analysis", file, { dst_actions: ["redness", "oiliness", "moisture", "radiance", "age_spot", "texture", "skin_type"], format: "json" }),
      ]);

      const { undertone, depth } = deriveUndertoneAndDepth(tone.skin_color ?? "#8D5A3B");
      const season = getColorSeason(undertone, depth);
      const conditions: SkinConditions = {
        redness: scoreOf(skin.redness),
        oiliness: scoreOf(skin.oiliness),
        moisture: scoreOf(skin.moisture),
        radiance: scoreOf(skin.radiance),
        spots: scoreOf(skin.age_spot), // API name → our LookProfile name (DEVELOPMENT §6.3)
        texture: scoreOf(skin.texture),
      };
      const ranked = Object.entries(conditions).sort((a, b) => a[1].ui - b[1].ui);
      const focusAreas = ranked.filter(([, s]) => s.ui < 50).slice(0, 3).map(([k]) => FOCUS_LABELS[k]);
      const strengths = ranked.filter(([, s]) => s.ui >= 65).slice(-2).map(([k]) => STRENGTH_LABELS[k]);
      const detectedRaw = String(skin.skin_type?.value ?? "").toLowerCase();
      const detectedSkinType = detectedRaw.startsWith("comb") ? "combo" : detectedRaw.startsWith("oil") ? "oily" : detectedRaw.startsWith("dry") ? "dry" : undefined;

      set({
        undertone,
        tone: depth,
        colorSeason: season,
        palette: getPaletteForSeason(season),
        avoidColors: [],
        skinConditions: conditions,
        skinFocusAreas: focusAreas,
        skinType: detectedSkinType,
      });
      setSkinRead({ conditions, focusAreas, strengths, detectedSkinType, mock: Boolean(tone.mock || skin.mock) });
      setAnalyzing(false);
      next(); // face → snapshot
    } catch (e) {
      setAnalyzing(false);
      setError(e instanceof Error ? e.message : "I couldn't read that photo — mind trying another?");
    }
  };

  // Composing slide runs the Composer (+ VTO when the journey includes apparel) on entry.
  useEffect(() => {
    if (slide !== "composing" || composeStarted.current) return;
    composeStarted.current = true;
    (async () => {
      const finalProfile: LookProfile = {
        ...profile,
        skinGoals: goals,
        climateSeason: getClimateSeason(profile.country ?? "Nigeria"),
      };
      setProfile(finalProfile);
      setComposeStatus("Reading your skin story…");
      const composed = composeLook(finalProfile, catalog);
      setLook(composed);

      if (journey !== "skin" && bodyFile) {
        const garment = composed.outfit.garments[0];
        setComposeStatus(garment ? `Rendering the ${garment.subcategory} on you…` : "Rendering your look…");
        try {
          const vto = await postYouCam("cloth", bodyFile, garment ? { ref_file_url: garment.image_url, garment_category: "full_body" } : {});
          setVtoUrl(vto.results?.url ?? null);
          setVtoMock(Boolean(vto.mock));
        } catch {
          setVtoUrl(null); // Look slide degrades to garment imagery — §13 error state, not a dead end.
        }
      }
      setComposeStatus("Tying it all together…");
      setTimeout(() => goTo("look"), 700);
    })();
  }, [slide, profile, goals, journey, bodyFile, goTo]);

  const reset = () => {
    setJourney(null);
    setSlide("greeting");
    setDirection(1);
    setProfile({});
    setFaceFile(null);
    setFacePreview(null);
    setLighting("unchecked");
    setSkinRead(null);
    setGoals([]);
    setBodyFile(null);
    setBodyPreview(null);
    setLook(null);
    setVtoUrl(null);
    setVtoMock(false);
    setError(null);
    composeStarted.current = false;
  };

  const heroUrl = vtoUrl ?? (journey === "skin" ? facePreview : look?.outfit.garments[0]?.image_url) ?? null;
  const showBack = index > 0 && slide !== "composing" && slide !== "look" && slide !== "snapshot";
  const progress = Math.min(1, Math.max(0, index / (slides.length - 1)));

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-neutral-100 px-4 py-8">
      <div className="flex w-full max-w-md flex-col rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
      <div className="mb-5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
          <motion.div className="h-full bg-neutral-900" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="mt-2 flex h-6 items-center justify-between">
          {showBack ? (
            <button type="button" onClick={back} className="text-sm text-neutral-400 hover:text-neutral-700">← back</button>
          ) : (
            <span />
          )}
          <span className="text-xs font-medium tracking-wide text-neutral-400">Ensemble Studio</span>
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="relative flex-1">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide}
            custom={direction}
            initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {slide === "greeting" && (
              <div className="pt-10 text-start">
                <motion.h1
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl font-semibold text-neutral-900"
                >
                  Welcome to Ensemble Studio!  🌸
                </motion.h1>
                <motion.p
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="mt-3 text-base text-neutral-700"
                >
                  My name is Dora!  <strong className="italic">What can I help you with today?</strong>
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.5 }}
                  className="mt-6 space-y-3 text-left"
                >
                  <BigChoice
                    emoji="✨"
                    title="Glow your skin"
                    sub="Skincare + makeup, matched to your skin colour"
                    onClick={() => { setJourney("skin"); setTimeout(next, 220); }}
                  />
                  <BigChoice
                    emoji="👗"
                    title="Apparel that suits you"
                    sub="Outfits match to your body size, shape, and skin tone"
                    onClick={() => { setJourney("apparel"); setTimeout(next, 220); }}
                  />
                  <BigChoice
                    emoji="💫"
                    title="Both, I want the complete look"
                    sub="One coordinated look, skin to outfit"
                    onClick={() => { setJourney("both"); setTimeout(next, 220); }}
                  />
                </motion.div>
              </div>
            )}

            {slide === "occasion" && (
              <div>
                <Dora line="Lovely. What's the moment?" sub="I style the occasion, not just the pieces." />
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((o) => (
                    <Chip key={o} active={profile.occasion === o} onClick={() => pickAndGo({ occasion: o })}>{o}</Chip>
                  ))}
                </div>
              </div>
            )}

            {slide === "budget" && (
              <div>
                <Dora line="And how are we shopping today?" />
                <div className="flex flex-col gap-2">
                  {BUDGETS.map((b) => (
                    <Chip key={b.value} active={profile.budget === b.value} onClick={() => pickAndGo({ budget: b.value })}>{b.label}</Chip>
                  ))}
                  <button type="button" onClick={next} className="mt-1 text-sm text-neutral-400 underline-offset-2 hover:underline">
                    no preference — surprise me
                  </button>
                </div>
              </div>
            )}

            {slide === "country" && (
              <div>
                <Dora line="Where in the world are you?" sub="Weather changes fabrics and skincare — not your colours." />
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => (
                    <Chip key={c} active={profile.country === c} onClick={() => pickAndGo({ country: c })}>{c}</Chip>
                  ))}
                </div>
              </div>
            )}

            {slide === "face" && (
              <div>
                <Dora
                  line={journey === "apparel" ? "First, a quick peek at your skin." : "Now — your skin, first."}
                  sub={journey === "apparel" ? "Even for outfits: your undertone decides which colours love you back." : "A clear, well-lit selfie. It drives everything that follows."}
                />
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50">
                  {facePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={facePreview} alt="Your selfie" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <span className="text-3xl">🤳</span>
                      <span className="text-sm text-neutral-500">Tap to take or choose a selfie</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => e.target.files?.[0] && onFaceFile(e.target.files[0])} />
                </label>
                <div className="mt-3 min-h-6 text-sm">
                  {lighting === "checking" && <p className="text-neutral-500">Checking the light…</p>}
                  {lighting === "dark" && <p className="text-amber-700">A bit too dark for an honest read — face a window and tap to retake.</p>}
                  {lighting === "blown" && <p className="text-amber-700">Very bright — step back from direct light and tap to retake.</p>}
                  {analyzing && <p className="text-neutral-700">Light looks good — reading your skin…</p>}
                </div>
                <p className="mt-2 text-center text-xs text-neutral-400">Cosmetic guidance from a photo — not medical advice.</p>
              </div>
            )}

            {slide === "snapshot" && skinRead && (
              <div>
                <Dora line="Here's what I see — the good stuff first." sub={skinRead.mock ? "Sample skin read (mock mode — no API key yet)." : undefined} />
                <div className="rounded-2xl bg-neutral-50 p-5">
                  {skinRead.strengths.length > 0 && (
                    <p className="text-sm leading-relaxed text-neutral-800">
                      Where your skin's thriving: <span className="font-medium">{skinRead.strengths.join(", ")}</span>.
                    </p>
                  )}
                  {skinRead.focusAreas.length > 0 ? (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                      Today we'll give a little love to: <span className="font-medium">{skinRead.focusAreas.join(", ")}</span>.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-800">Your skin's looking beautifully balanced today.</p>
                  )}
                  {profile.undertone && (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                      You're <span className="font-medium">{profile.undertone}-toned</span> — a {profile.colorSeason} palette suits you.
                    </p>
                  )}
                </div>
                <motion.button
                  type="button"
                  onClick={next}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-5 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white"
                >
                  sounds like me — keep going
                </motion.button>
              </div>
            )}

            {slide === "skinType" && (
              <div>
                <Dora
                  line="How does your skin usually behave?"
                  sub={skinRead?.detectedSkinType ? `I'm reading ${skinRead.detectedSkinType} — confirm or correct me.` : undefined}
                />
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((t) => (
                    <Chip key={t} active={profile.skinType === t} onClick={() => pickAndGo({ skinType: t })}>{t}</Chip>
                  ))}
                </div>
              </div>
            )}

            {slide === "goals" && (
              <div>
                <Dora line="Anything you'd love to work toward?" sub="Pick up to two — or skip." />
                <div className="flex flex-wrap gap-2">
                  {SKIN_GOALS.map((g) => (
                    <Chip
                      key={g}
                      active={goals.includes(g)}
                      onClick={() => {
                        const nextGoals = goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g].slice(-2);
                        setGoals(nextGoals);
                        if (nextGoals.length === 2) setTimeout(next, 320);
                      }}
                    >
                      {g}
                    </Chip>
                  ))}
                </div>
                <button type="button" onClick={next} className="mt-4 text-sm text-neutral-400 underline-offset-2 hover:underline">
                  {goals.length > 0 ? "that's everything →" : "skip →"}
                </button>
              </div>
            )}

            {slide === "safety" && (
              <div>
                <Dora line="Anything I should be careful with?" sub="This quietly filters what I recommend — nothing more." />
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={Boolean(profile.safetyFlags?.pregnant)}
                    onClick={() =>
                      set({ safetyFlags: { pregnant: !profile.safetyFlags?.pregnant, breastfeeding: false, sensitivities: profile.safetyFlags?.sensitivities ?? [], activeTreatment: profile.safetyFlags?.activeTreatment ?? false, allergies: [] } })
                    }
                  >
                    pregnant / nursing
                  </Chip>
                  <Chip
                    active={Boolean(profile.safetyFlags?.sensitivities?.length)}
                    onClick={() =>
                      set({ safetyFlags: { pregnant: profile.safetyFlags?.pregnant ?? false, breastfeeding: false, sensitivities: profile.safetyFlags?.sensitivities?.length ? [] : ["sensitive"], activeTreatment: profile.safetyFlags?.activeTreatment ?? false, allergies: [] } })
                    }
                  >
                    sensitive skin
                  </Chip>
                  <Chip
                    active={Boolean(profile.safetyFlags?.activeTreatment)}
                    onClick={() =>
                      set({ safetyFlags: { pregnant: profile.safetyFlags?.pregnant ?? false, breastfeeding: false, sensitivities: profile.safetyFlags?.sensitivities ?? [], activeTreatment: !profile.safetyFlags?.activeTreatment, allergies: [] } })
                    }
                  >
                    on skin treatment
                  </Chip>
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="mt-6 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white"
                >
                  {profile.safetyFlags && (profile.safetyFlags.pregnant || profile.safetyFlags.sensitivities.length > 0 || profile.safetyFlags.activeTreatment) ? "noted — continue" : "nothing to flag"}
                </button>
              </div>
            )}

            {slide === "body" && (
              <div>
                <Dora line="Now, the outfit canvas." sub="A full-body photo — I'll show the look on you. Processed for this look only, never stored." />
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50">
                  {bodyPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bodyPreview} alt="Your full-body photo" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <span className="text-3xl">🧍</span>
                      <span className="text-sm text-neutral-500">Tap to add a full-body photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setBodyFile(f);
                        setBodyPreview(URL.createObjectURL(f));
                        setTimeout(next, 400);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            {slide === "sizing" && (
              <div>
                <Dora
                  line="Last one — sizing."
                  sub="The try-on adapts to your pose from the photo; this just makes the shop links right."
                />
                <p className="mb-2 text-sm font-medium text-neutral-700">Your usual size</p>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <Chip
                      key={s}
                      active={profile.size === s}
                      onClick={() => {
                        set({ size: s });
                        if (profile.fitPref) setTimeout(next, 220);
                      }}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
                <p className="mb-2 mt-5 text-sm font-medium text-neutral-700">How you like things to sit</p>
                <div className="flex flex-wrap gap-2">
                  {FITS.map((f) => (
                    <Chip
                      key={f}
                      active={profile.fitPref === f}
                      onClick={() => {
                        set({ fitPref: f });
                        if (profile.size) setTimeout(next, 220);
                      }}
                    >
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {slide === "composing" && (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <motion.span
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 to-amber-200 text-3xl"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                >
                  🌸
                </motion.span>
                <p className="text-sm text-neutral-700">{composeStatus}</p>
              </div>
            )}

            {slide === "look" && look && (
              <div className="flex flex-col gap-5">
                <Dora
                  line={`Your look for ${look.occasion}.`}
                  sub={
                    journey === "skin"
                      ? "Skin first — and I've noted the outfit colours that would finish it."
                      : journey === "apparel"
                        ? "Chosen in your colours — with the finish that completes it."
                        : "One look, skin to outfit — every piece agreeing with the next."
                  }
                />

                {heroUrl && (
                  <div className="relative overflow-hidden rounded-2xl bg-neutral-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroUrl} alt="The look" className="w-full object-cover" />
                    {vtoMock && (
                      <span className="absolute left-3 top-3 rounded-full bg-neutral-900/80 px-3 py-1 text-xs text-white">
                        mock mode — try-on render arrives with the API key
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm leading-relaxed text-neutral-800">{look.rationale}</p>

                {look.reasons.length > 0 && (
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-neutral-900">Why this look?</p>
                    <ul className="space-y-1.5">
                      {look.reasons.map((r) => (
                        <li key={r.claim} className="flex gap-2 text-sm text-neutral-700">
                          <span className="text-green-600">✓</span>
                          <span>
                            {r.claim} <span className="text-xs text-neutral-400">({r.source === "skinCondition" ? "skin analysis" : r.source})</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(journey === "skin"
                  ? (["beauty", "outfit"] as const)
                  : (["outfit", "beauty"] as const)
                ).map((section) =>
                  section === "outfit" ? (
                    <div key="outfit">
                      <p className="mb-2 text-sm font-semibold text-neutral-900">
                        {journey === "skin" ? "Complete the look" : "The outfit"}
                      </p>
                      <div className="space-y-2">
                        {look.outfit.garments.map((g) => <ProductRow key={g.id} product={g} />)}
                      </div>
                    </div>
                  ) : (
                    <div key="beauty" className="flex flex-col gap-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-neutral-900">Skin prep</p>
                        <div className="space-y-2">
                          {look.beauty.skincarePrep.map((p) => <ProductRow key={p.id} product={p} />)}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-neutral-900">{journey === "apparel" ? "Finish the look" : "The finish"}</p>
                        <div className="space-y-2">
                          {look.beauty.makeup.map((p) => <ProductRow key={p.id} product={p} />)}
                        </div>
                      </div>
                    </div>
                  )
                )}

                <p className="text-xs leading-relaxed text-neutral-400">
                  Cosmetic guidance, not medical advice — see a professional for skin health concerns. Colour matching uses a
                  simplified seasonal engine, not a professional colour session. Try-on shows colour and silhouette on you, not exact fit.
                </p>
                <button type="button" onClick={reset} className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-semibold text-neutral-700">
                  Start a new look
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
