// One-off: pull the landing marquee/feature photos from Unsplash and bake
// right-sized webp copies into public/landing so the hero serves same-origin.
// Re-run only when the image set in src/lib/landing/images.ts changes.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = new URL("../public/landing/", import.meta.url);

// column images fill ~1/3 of a 47vw panel; row thumbs render at 144x112
const GROUPS = [
  { dir: "columns", width: 600, ids: [
    "1695972235653-2d241f8cd412", "1728726558882-1ae77b8a9a4d",
    "1766238955654-62ab91837258", "1772322586785-3a34772cbc61",
    "1586878341523-7acb55eb8c12", "1673241073960-d81caabefc6c",
    "1708486235073-14879ff14c4c", "1680461494862-754e01607c83",
    "1687716432612-2a46da37a43b", "1677779817420-b3ad7a4a1f2c",
    "1781356001765-1ed05cf85286", "1614606140245-2c33ece9e2cf",
  ] },
  { dir: "rows", width: 360, height: 280, ids: [
    "1675081633633-b9d62afa1dd9", "1739272135664-0c6342ffd470",
    "1649118478063-fe9ad0876c6f", "1668255447177-cfbee96dcc98",
    "1543422018-9a1c40cf955d", "1661393179485-b53fcf5a913c",
    "1602532386405-9f3cce79a00b", "1776951646984-8fe333e7d15b",
    "1558108545-a0f86eda7d55",
  ] },
  { dir: "features", width: 1200, ids: [
    "1724934956582-aab996f08484", "1723238221275-362f37617f7e",
    "1729525292997-b7ed08572551",
  ] },
];

for (const group of GROUPS) {
  await mkdir(new URL(`${group.dir}/`, OUT), { recursive: true });
  for (const id of group.ids) {
    const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${id}: ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());
    const out = await sharp(input)
      .resize(group.width, group.height, { fit: "cover" })
      .webp({ quality: 72 })
      .toBuffer();
    await writeFile(new URL(`${group.dir}/${id}.webp`, OUT), out);
    console.log(group.dir, id, `${(out.length / 1024).toFixed(0)}kB`);
  }
}
