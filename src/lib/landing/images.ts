// Regenerate with: node scripts/fetch-landing-images.mjs
const column = (id: string) => `/landing/columns/${id}.webp`;
const row = (id: string) => `/landing/rows/${id}.webp`;
const feature = (id: string) => `/landing/features/${id}.webp`;

export interface MarqueeImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const COLUMN_SIZE = { width: 600, height: 402 };
const ROW_SIZE = { width: 360, height: 280 };

export const heroColumns: MarqueeImage[][] = [
  [
    { src: column("1695972235653-2d241f8cd412"), alt: "Cosmetic bottle", ...COLUMN_SIZE },
    { src: column("1728726558882-1ae77b8a9a4d"), alt: "Silk fabric", ...COLUMN_SIZE },
    { src: column("1766238955654-62ab91837258"), alt: "Lipsticks", ...COLUMN_SIZE },
    { src: column("1772322586785-3a34772cbc61"), alt: "Nail polish", ...COLUMN_SIZE },
  ],
  [
    { src: column("1586878341523-7acb55eb8c12"), alt: "Gold jewelry", ...COLUMN_SIZE },
    { src: column("1673241073960-d81caabefc6c"), alt: "Eyeshadow palette", ...COLUMN_SIZE },
    { src: column("1708486235073-14879ff14c4c"), alt: "Perfume bottle", ...COLUMN_SIZE },
    { src: column("1680461494862-754e01607c83"), alt: "Cosmetic cream", ...COLUMN_SIZE },
  ],
  [
    { src: column("1687716432612-2a46da37a43b"), alt: "Makeup brushes", ...COLUMN_SIZE },
    { src: column("1677779817420-b3ad7a4a1f2c"), alt: "Fabric texture", ...COLUMN_SIZE },
    { src: column("1781356001765-1ed05cf85286"), alt: "Blush powder", ...COLUMN_SIZE },
    { src: column("1614606140245-2c33ece9e2cf"), alt: "Gold accessories", ...COLUMN_SIZE },
  ],
];

export const heroRows: MarqueeImage[][] = [
  [
    { src: row("1675081633633-b9d62afa1dd9"), alt: "Lipstick", ...ROW_SIZE },
    { src: row("1739272135664-0c6342ffd470"), alt: "Silk fabric", ...ROW_SIZE },
    { src: row("1649118478063-fe9ad0876c6f"), alt: "Gold jewelry", ...ROW_SIZE },
  ],
  [
    { src: row("1668255447177-cfbee96dcc98"), alt: "Eyeshadow palette", ...ROW_SIZE },
    { src: row("1543422018-9a1c40cf955d"), alt: "Perfume bottle", ...ROW_SIZE },
    { src: row("1661393179485-b53fcf5a913c"), alt: "Makeup brushes", ...ROW_SIZE },
  ],
  [
    { src: row("1602532386405-9f3cce79a00b"), alt: "Blush powder", ...ROW_SIZE },
    { src: row("1776951646984-8fe333e7d15b"), alt: "Fabric texture", ...ROW_SIZE },
    { src: row("1558108545-a0f86eda7d55"), alt: "Nail polish", ...ROW_SIZE },
  ],
];

export const heroPreloads = [
  ...heroColumns.map((images) => ({
    src: images[0].src,
    media: "(min-width: 1024px)",
  })),
  ...heroRows.map((images) => ({
    src: images[0].src,
    media: "(max-width: 1023px)",
  })),
];

export const featureImages = {
  coordination: feature("1724934956582-aab996f08484"),
  palette: feature("1723238221275-362f37617f7e"),
  shownOnYou: feature("1729525292997-b7ed08572551"),
};
