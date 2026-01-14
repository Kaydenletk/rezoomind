import { mkdir, writeFile } from "fs/promises";
import path from "path";
const outputDir = path.join(process.cwd(), "public", "logos");
const fillColor = "#0b1220";

const logoList = [
  { title: "Stripe", slug: "stripe" },
  { title: "Notion", slug: "notion" },
  { title: "Airbnb", slug: "airbnb" },
  { title: "NVIDIA", slug: "nvidia" },
  { title: "TikTok", slug: "tiktok" },
  { title: "Uber", slug: "uber" },
  { title: "Shopify", slug: "shopify" },
  { title: "Coinbase", slug: "coinbase" },
  { title: "DoorDash", slug: "doordash" },
  { title: "Reddit", slug: "reddit" },
  { title: "Google", slug: "google" },
  { title: "Meta", slug: "meta" },
  { title: "Netflix", slug: "netflix" },
  { title: "Intel", slug: "intel" },
  { title: "AMD", slug: "amd" },
  { title: "Apple", slug: "apple" },
  { title: "Tesla", slug: "tesla" },
  { title: "Databricks", slug: "databricks" },
];

const normalizeKey = (value) =>
  `si${value.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;

const toSvg = (icon) =>
  `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>${icon.title}</title><path fill="${fillColor}" d="${icon.path}"/></svg>`;

const run = async () => {
  const icons = await import("simple-icons");
  await mkdir(outputDir, { recursive: true });

  const missing = [];
  for (const entry of logoList) {
    const slugKey = normalizeKey(entry.slug);
    const titleKey = normalizeKey(entry.title);
    const matchedKey =
      Object.keys(icons).find((key) => key.toLowerCase() === slugKey) ??
      Object.keys(icons).find((key) => key.toLowerCase() === titleKey);
    const icon = matchedKey ? icons[matchedKey] : null;

    if (!icon) {
      missing.push(entry);
      continue;
    }

    const svg = toSvg(icon);
    const filename = `${entry.slug}.svg`;
    await writeFile(path.join(outputDir, filename), svg, "utf8");
    console.info(`[logos] wrote ${filename}`);
  }

  if (missing.length) {
    console.warn("[logos] missing icons:", missing);
  }
};

run().catch((error) => {
  console.error("[logos] export failed", error);
  process.exit(1);
});
