#!/usr/bin/env node
// Smoke-test inbox/prefs.yaml watchlists. Not ingest: no JD fetch, no scoring, no files written.
// Usage: node scripts/probe.mjs
//
// Gate: every live Greenhouse/Ashby token must return HTTP 200.
// Title scan is advisory (empty hits are a valid market result).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { classifyTitle } from "./lib/radar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PREFS = path.join(ROOT, "inbox/prefs.yaml");
const UA = "cv-generator-watchlist-probe/1.0 (personal job search)";
const PAUSE_MS = 80;
const VERBOSE = process.argv.includes("--verbose") || process.env.VERBOSE === "1";

const prefs = yaml.load(fs.readFileSync(PREFS, "utf8"));
const ghTokens = (prefs.watchlist_greenhouse || []).map(String).map((s) => s.trim());
const ashbyTokens = (prefs.watchlist_ashby || []).map(String).map((s) => s.trim());
const deadGh = new Set((prefs.watchlist_dead?.greenhouse || []).map(String).map((s) => s.trim()));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function jobsFrom(source, body) {
  const jobs = body?.jobs || [];
  return jobs.map((j) => {
    const title = j.title || "";
    let location = "";
    if (source === "greenhouse") location = j.location?.name || "";
    else location = typeof j.location === "string" ? j.location : j.location?.locationName || j.location?.name || "";
    const url = j.absolute_url || j.jobUrl || j.applyUrl || "";
    return { title, location, url };
  });
}

async function probe(source, token) {
  const url =
    source === "greenhouse"
      ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`
      : `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`;
  try {
    const { status, body } = await getJson(url);
    const jobs = status === 200 ? jobsFrom(source, body) : [];
    return { source, token, status, count: jobs.length, jobs, err: null };
  } catch (e) {
    return { source, token, status: 0, count: 0, jobs: [], err: e.message };
  }
}

const skippedDead = ghTokens.filter((t) => deadGh.has(t));
const liveGh = ghTokens.filter((t) => !deadGh.has(t));

console.log(
  `watchlist probe — ${liveGh.length} greenhouse + ${ashbyTokens.length} ashby from inbox/prefs.yaml` +
    (skippedDead.length ? ` (skipped dead: ${skippedDead.join(", ")})` : ""),
);

const results = [];
for (const token of liveGh) {
  results.push(await probe("greenhouse", token));
  await sleep(PAUSE_MS);
}
for (const token of ashbyTokens) {
  results.push(await probe("ashby", token));
  await sleep(PAUSE_MS);
}

let failed = 0;
for (const r of results) {
  const ok = r.status === 200;
  if (!ok) failed += 1;
  const mark = ok ? "" : "  FAIL";
  const err = r.err ? `  (${r.err})` : "";
  console.log(`  ${String(r.status).padStart(3)}  n=${String(r.count).padStart(4)}  ${r.source}/${r.token}${mark}${err}`);
}

const hits = [];
for (const r of results) {
  if (r.status !== 200) continue;
  for (const job of r.jobs) {
    const cls = classifyTitle(job.title);
    if (!cls) continue;
    hits.push({ ...cls, source: r.source, token: r.token, ...job });
  }
}

const core = hits.filter((h) => h.band === "core");
const stretch = hits.filter((h) => h.band === "stretch");
const pitfalls = hits.filter((h) => h.band === "pitfall");

console.log("\ntitle scan (core/stretch; pitfalls vetoed, listed for the matcher)");
const show = [...core, ...stretch];
if (show.length === 0) {
  console.log("  (none — empty scan is a valid result)");
} else {
  for (const h of show) {
    console.log(`  [${h.band}] ${h.source}/${h.token}: ${h.title}  |  ${h.location}`);
    if (h.url) console.log(`         ${h.url}`);
  }
}
if (pitfalls.length) {
  const byWhy = new Map();
  for (const h of pitfalls) byWhy.set(h.why, (byWhy.get(h.why) || 0) + 1);
  const summary = [...byWhy.entries()].map(([w, n]) => `${w} ×${n}`).join("; ");
  console.log(`\npitfalls: ${pitfalls.length}  (${summary})`);
  if (VERBOSE) {
    for (const h of pitfalls) {
      console.log(`  [${h.why}] ${h.source}/${h.token}: ${h.title}  |  ${h.location}`);
    }
  } else {
    console.log("  re-run with VERBOSE=1 to list them");
  }
}

console.log(
  `\nboards: ${results.length - failed}/${results.length} HTTP 200   hits: ${core.length} core, ${stretch.length} stretch, ${pitfalls.length} pitfall`,
);

if (failed) {
  console.error(`probe failed: ${failed} live token(s) did not return 200`);
  process.exit(1);
}
