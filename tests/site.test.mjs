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
  const expectedBrands = ["arlo", "eufy", "google-nest", "reolink", "ring", "simplisafe"];

  assert.equal(report.date, "2026-08-08");
  assert.equal(report.topSignals.length, 5);
  assert.deepEqual(report.brands.map((brand) => brand.id).sort(), expectedBrands);
  assert.ok(report.brands.every((brand) => brand.snapshot.length >= 2));
  assert.equal(report.brands.find((brand) => brand.id === "reolink").role, "owned");
  assert.ok(report.brands.filter((brand) => brand.id !== "reolink").every((brand) => brand.role === "competitor"));

  const sources = report.brands.flatMap((brand) =>
    brand.snapshot.flatMap((item) => item.sources),
  );
  assert.ok(sources.length >= 15);
  assert.ok(sources.every((source) => source.url.startsWith("https://")));
});

test("tracks marketing, PR, channel, and reputation events with evidence labels", async () => {
  const source = await readFile(new URL("data/reports/2026-08-08.json", root), "utf8");
  const report = JSON.parse(source);
  const radar = report.marketingRadar;
  const expectedTypes = ["Campaign", "PR / 合作", "渠道事件", "风险 / 舆情"];
  const expectedEvidence = ["官方 / 品牌方", "权威媒体", "第三方监测", "社区信号"];

  assert.ok(radar);
  assert.ok(radar.events.length >= 20);
  assert.deepEqual([...new Set(radar.events.map((event) => event.type))].sort(), expectedTypes.sort());
  assert.ok(expectedEvidence.every((label) => radar.events.some((event) => event.evidence === label)));
  assert.ok(radar.events.every((event) => event.sources.length > 0));
  assert.ok(radar.events.flatMap((event) => event.sources).every((item) => item.url.startsWith("https://")));
  assert.ok(radar.events.some((event) => event.verification === "持续观察"));
  assert.ok(radar.events.filter((event) => event.brand === "reolink").length >= 4);
});

test("keeps every brand reference valid and includes Reolink across time views", async () => {
  const source = await readFile(new URL("data/reports/2026-08-08.json", root), "utf8");
  const report = JSON.parse(source);
  const knownBrands = new Set(report.brands.map((brand) => brand.id));
  const referencedBrands = [
    ...report.topSignals.flatMap((signal) => [signal.brand]),
    ...report.marketingRadar.events.flatMap((event) => [event.brand, ...(event.relatedBrands ?? [])]),
    ...report.sevenDay.events.flatMap((event) => [event.brand, ...(event.relatedBrands ?? [])]),
    ...report.thirtyDay.routes.flatMap((route) => [route.brand]),
  ];
  const reolink = report.brands.find((brand) => brand.id === "reolink");

  assert.ok(referencedBrands.every((brand) => knownBrands.has(brand)));
  assert.ok(report.topSignals.some((signal) => signal.brand === "reolink"));
  assert.ok(report.sevenDay.events.some((event) => event.brand === "reolink" || event.relatedBrands?.includes("reolink")));
  assert.ok(report.thirtyDay.routes.some((route) => route.brand === "reolink"));
  assert.ok(reolink.snapshot.flatMap((item) => item.sources).every((item) => item.url.startsWith("https://")));
});

test("preserves the corrected launch-date language", async () => {
  const source = await readFile(new URL("data/reports/2026-08-08.json", root), "utf8");
  const report = JSON.parse(source);
  const arlo = report.brands.find((brand) => brand.id === "arlo");
  const google = report.brands.find((brand) => brand.id === "google-nest");

  assert.match(arlo.snapshot[0].detail, /2025 年发布/);
  assert.match(google.snapshot[0].detail, /2025 年发布/);
});
