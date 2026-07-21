import { featureImages } from "@/lib/landing/images";

export const hero = {
  title: "Getting ready is one decision, not two guesses.",
  subtitle:
    "Ensemble reads your skin, then dresses you for it, the outfit color, the base finish, the lip, all one coordinated look, shown on you.",
  cta: "Get your look",
  micro: "free · two minutes · never stored",
  navLink: "How it works",
};

export type PetalTone = "petal-1" | "petal-2" | "petal-3" | "accent";

export interface Feature {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  caption?: string;
  captionTone?: PetalTone;
  imageSide?: "left" | "right";
  steps?: { number: string; label: string }[];
  note?: string;
  tags?: string[];
}

export const features: Feature[] = [
  {
    eyebrow: "The coordination",
    title: "One flow. One look.",
    description:
      "You don't get a skin report and a separate shopping list. Ensemble reads your skin once - and that single read chooses your outfit's colour, your base finish, and your lip, each because of the others. Take the scan away and the look has nothing to stand on.",
    image: featureImages.coordination,
    caption: "skin, colour + beauty - coordinated",
    captionTone: "accent",
    imageSide: "right",
    steps: [
      { number: "01", label: "Tell us the occasion" },
      { number: "02", label: "Scan your face" },
      { number: "03", label: "One photo, dressed on you" },
      { number: "04", label: "Your coordinated look" },
    ],
  },
  {
    eyebrow: "Your palette",
    title: "Your colour, read from your skin.",
    description:
      "Warm or cool, light or deep - your undertone points to a season, and your season is a palette chosen to flatter you right where it counts: near your face. The colours you see on screen are yours, not a trend.",
    image: featureImages.palette,
    caption: "your season, your palette",
    captionTone: "petal-2",
    imageSide: "left",
  },
  {
    eyebrow: "Shown on you",
    title: "Worn on you - never a stock model.",
    description:
      "Upload one photo and the outfit is rendered onto your own body - your shape, your colouring - so you see how the colour and silhouette actually sit on you. We're honest about it: this shows colour and fit intent, and every piece comes with its real fabric and size.",
    image: featureImages.shownOnYou,
    caption: "shown on you",
    captionTone: "petal-1",
    imageSide: "right",
    tags: ["100% linen", "relaxed fit", "your size"],
  },
];

export const deletionTest = {
  title: "Take the skin scan away, and the look falls apart.",
  withScan: {
    label: "With your skin",
    body: "Autumn palette. Terracotta near your face. A warm lip that ties to it.",
  },
  withoutScan: {
    label: "Without it",
    body: "A generic render. Any color, any body, anyone's clothes.",
  },
  footnote: "Powered by YouCam Skin AI + Apparel VTO, working as one.",
};

export const trust = {
  title: "Kind by design.",
  body: "Ensemble never scores or shames your skin - it leads with what's thriving, and it's built to get medium and deep skin tones right, not as an afterthought. Photos are used once and never stored.",
};

export const footer = {
  disclaimer: "Cosmetic guidance, not medical advice.",
  credit: "Built with YouCam API · Skin AI + Apparel VTO",
};
