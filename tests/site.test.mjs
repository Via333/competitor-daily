import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds a GitHub Pages-ready entry page", async () => {
  const html = await readFile(new URL("dist/index.html", root), "utf8");

  assert.match(html, /<title>美国安防竞品雷达<\/title>/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\.\/assets\/index-[^"']+\.js/);
  assert.match(html, /\.\/assets\/index-[^"']+\.css/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/);
});

test("keeps the baseline report structurally complete", async () => {
  const source = await readFile(new URL("data/reports/2026-08-08.json", root), "utf8");
  const report = JSON.parse(source);
  const expectedBrands = ["arlo", "eufy", "google-nest", "ring", "simplisafe"];

  assert.equal(report.date, "2026-08-08");
  assert.equal(report.topSignals.length, 5);
  assert.deepEqual(report.brands.map((brand) => brand.id).sort(), expectedBrands);
  assert.ok(report.brands.every((brand) => brand.snapshot.length >= 2));

  const sources = report.brands.flatMap((brand) =>
    brand.snapshot.flatMap((item) => item.sources),
  );
  assert.ok(sources.length >= 15);
  assert.ok(sources.every((source) => source.url.startsWith("https://")));
});

test("preserves the corrected launch-date language", async () => {
  const source = await readFile(new URL("data/reports/2026-08-08.json", root), "utf8");
  const report = JSON.parse(source);
  const arlo = report.brands.find((brand) => brand.id === "arlo");
  const google = report.brands.find((brand) => brand.id === "google-nest");

  assert.match(arlo.snapshot[0].detail, /2025 年发布/);
  assert.match(google.snapshot[0].detail, /2025 年发布/);
});
