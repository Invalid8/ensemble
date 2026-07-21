const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface MarqueeImage {
  src: string;
  alt: string;
}

export const heroColumns: MarqueeImage[][] = [
  [
    { src: unsplash("1695972235653-2d241f8cd412"), alt: "Cosmetic bottle" },
    { src: unsplash("1728726558882-1ae77b8a9a4d"), alt: "Silk fabric" },
    { src: unsplash("1766238955654-62ab91837258"), alt: "Lipsticks" },
    { src: unsplash("1772322586785-3a34772cbc61"), alt: "Nail polish" },
  ],
  [
    { src: unsplash("1586878341523-7acb55eb8c12"), alt: "Gold jewelry" },
    { src: unsplash("1673241073960-d81caabefc6c"), alt: "Eyeshadow palette" },
    { src: unsplash("1708486235073-14879ff14c4c"), alt: "Perfume bottle" },
    { src: unsplash("1680461494862-754e01607c83"), alt: "Cosmetic cream" },
  ],
  [
    { src: unsplash("1687716432612-2a46da37a43b"), alt: "Makeup brushes" },
    { src: unsplash("1677779817420-b3ad7a4a1f2c"), alt: "Fabric texture" },
    { src: unsplash("1781356001765-1ed05cf85286"), alt: "Blush powder" },
    { src: unsplash("1614606140245-2c33ece9e2cf"), alt: "Gold accessories" },
  ],
];

export const heroRows: MarqueeImage[][] = [
  [
    { src: unsplash("1675081633633-b9d62afa1dd9"), alt: "Lipstick" },
    { src: unsplash("1739272135664-0c6342ffd470"), alt: "Silk fabric" },
    { src: unsplash("1649118478063-fe9ad0876c6f"), alt: "Gold jewelry" },
  ],
  [
    { src: unsplash("1668255447177-cfbee96dcc98"), alt: "Eyeshadow palette" },
    { src: unsplash("1543422018-9a1c40cf955d"), alt: "Perfume bottle" },
    { src: unsplash("1661393179485-b53fcf5a913c"), alt: "Makeup brushes" },
  ],
  [
    { src: unsplash("1602532386405-9f3cce79a00b"), alt: "Blush powder" },
    { src: unsplash("1776951646984-8fe333e7d15b"), alt: "Fabric texture" },
    { src: unsplash("1558108545-a0f86eda7d55"), alt: "Nail polish" },
  ],
];

export const featureImages = {
  coordination: unsplash("1724934956582-aab996f08484", 1000),
  palette: unsplash("1723238221275-362f37617f7e", 1000),
  shownOnYou: unsplash("1729525292997-b7ed08572551", 1000),
};
