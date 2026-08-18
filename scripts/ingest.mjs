#!/usr/bin/env node
// Job-radar ingest: title-prefilter watchlists, fetch ≤15 JDs, score, write shortlist.
// Usage:
//   node scripts/ingest.mjs
//   node scripts/ingest.mjs --replay-only   # 18 Aug Collibra/Elastic/N26 gate, no live fetch
//
// Never Preps the 18 Aug catalog-vendor attorney / IS-controls / hybrid-PS cards.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import {
  CARD_CAP,
  FETCH_CAP,
  REPLAY_EXPECTED,
  classifyTitle,
  htmlToText,
  jobCompany,
  jobId,
  jobLocation,
  jobText,
  jobUrl,
  rankForFetch,
  renderShortlist,
  scoreJob,
  selectShortlist,
} from "./lib/radar.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PREFS = path.join(ROOT, "inbox/prefs.yaml");
const FIXTURE = path.join(ROOT, "scripts/fixtures/replay-2026-08-18.json");
const UA = "cv-generator-ingest/1.0 (personal job search)";
const PAUSE_MS = 80;
const VERBOSE = process.argv.includes("--verbose") || process.env.VERBOSE === "1";
const REPLAY_ONLY = process.argv.includes("--replay-only");

const prefs = yaml.load(fs.readFileSync(PREFS, "utf8"));
const ghTokens = (prefs.watchlist_greenhouse || []).map(String).map((s) => s.trim());
const ashbyTokens = (prefs.watchlist_ashby || []).map(String).map((s) => s.trim());
const deadGh = new Set((prefs.watchlist_dead?.greenhouse || []).map(String).map((s) => s.trim()));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Nicosia" });
}

function nowIso() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Europe/Nicosia" }).replace(" ", "T") + "+03:00";
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

function summarizeJob(source, token, raw) {
  return {
    source,
    token,
    id: jobId(raw),
    title: raw.title || "",
    location: jobLocation(source, raw),
    url: jobUrl(raw),
    company: jobCompany(raw, token),
    raw,
  };
}

function cachePath(source, token, id) {
  const dir = source === "ashby" ? "inbox/_ashby" : "inbox/_gh";
  return path.join(ROOT, dir, `${token}-${id}.json`);
}

function loadCachedRaw(source, token, id) {
  const single = cachePath(source, token, id);
  if (fs.existsSync(single)) return JSON.parse(fs.readFileSync(single, "utf8"));
  if (source === "greenhouse") {
    const dump = path.join(ROOT, "inbox/_gh", `${token}-content.json`);
    if (fs.existsSync(dump)) {
      const body = JSON.parse(fs.readFileSync(dump, "utf8"));
      return (body.jobs || []).find((j) => Number(j.id) === Number(id)) || null;
    }
  }
  return null;
}

function writeCache(source, token, id, raw) {
  const p = cachePath(source, token, id);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(raw));
}

function attachScore(job, text) {
  const scored = scoreJob({ ...job, text }, prefs);
  return { ...job, text, ...scored };
}

async function probeBoard(source, token) {
  const url =
    source === "greenhouse"
      ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`
      : `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`;
  try {
    const { status, body } = await getJson(url);
    const jobs = status === 200 ? body?.jobs || [] : [];
    return { source, token, status, count: jobs.length, jobs, err: null };
  } catch (e) {
    return { source, token, status: 0, count: 0, jobs: [], err: e.message };
  }
}

async function fetchContent(job) {
  if (job.source === "ashby" && (job.raw.descriptionPlain || job.raw.descriptionHtml)) {
    return jobText(job.source, job.raw);
  }
  const cached = loadCachedRaw(job.source, job.token, job.id);
  if (cached) return jobText(job.source, cached);
  if (job.source !== "greenhouse") return jobText(job.source, job.raw);

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(job.token)}/jobs/${encodeURIComponent(job.id)}`;
  const { status, body } = await getJson(url);
  if (status !== 200 || !body) {
    throw new Error(`job ${job.token}/${job.id} HTTP ${status}`);
  }
  writeCache(job.source, job.token, job.id, body);
  return jobText(job.source, body);
}

function loadReplayJobs() {
  const wanted = [
    { source: "greenhouse", token: "collibra", id: 8121031 },
    { source: "greenhouse", token: "elastic", id: 8138064 },
    { source: "greenhouse", token: "n26", id: 7992395 },
    { source: "greenhouse", token: "collibra", id: 8109533 },
    { source: "greenhouse", token: "collibra", id: 8095291 },
  ];
  const fromCache = [];
  for (const w of wanted) {
    const raw = loadCachedRaw(w.source, w.token, w.id);
    if (!raw) continue;
    fromCache.push({
      ...summarizeJob(w.source, w.token, raw),
      text: jobText(w.source, raw),
    });
  }
  if (fromCache.length === wanted.length) {
    return { origin: "cache", jobs: fromCache };
  }
  if (!fs.existsSync(FIXTURE)) {
    return { origin: "missing", jobs: [] };
  }
  const fixture = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  return {
    origin: "fixture",
    jobs: (fixture.jobs || []).map((j) => ({
      source: j.source || "greenhouse",
      token: j.token,
      id: j.id,
      title: j.title,
      location: j.location,
      url: j.url,
      company: j.company,
      text: j.text || htmlToText(j.content || ""),
    })),
  };
}

function runReplay() {
  const { origin, jobs } = loadReplayJobs();
  if (!jobs.length) {
    console.log("replay: skipped (18 Aug cache/fixture not on disk)");
    return { ok: origin === "missing", origin, cards: [] };
  }
  const cards = jobs.map((j) => attachScore(j, j.text));
  const failures = [];
  for (const c of cards) {
    const expected = REPLAY_EXPECTED[c.id];
    if (c.decision === "Prep") {
      failures.push(`${c.company} ${c.id} scored Prep (must be Later/Skip)`);
    }
    if (expected && c.decision !== expected) {
      failures.push(`${c.company} ${c.id} scored ${c.decision}, expected ${expected}`);
    }
  }
  console.log(`replay: ${origin}  ${cards.length} JDs`);
  for (const c of cards) {
    console.log(`  ${c.decision.padEnd(5)}  ${c.company} — ${c.displayTitle}`);
  }
  if (failures.length) {
    console.error("replay failed:");
    for (const f of failures) console.error(`  ${f}`);
    return { ok: false, origin, cards, failures };
  }
  return { ok: true, origin, cards };
}

async function ingest() {
  const liveGh = ghTokens.filter((t) => !deadGh.has(t));
  const skippedDead = ghTokens.filter((t) => deadGh.has(t));
  console.log(
    `ingest — ${liveGh.length} greenhouse + ${ashbyTokens.length} ashby` +
      (skippedDead.length ? ` (skipped dead: ${skippedDead.join(", ")})` : ""),
  );

  const boards = {};
  const listed = [];
  for (const token of liveGh) {
    const r = await probeBoard("greenhouse", token);
    boards[token] = { ok: r.status === 200, status: r.status, count: r.count, source: "greenhouse", err: r.err };
    const mark = r.status === 200 ? "" : "  FAIL";
    console.log(`  ${String(r.status).padStart(3)}  n=${String(r.count).padStart(4)}  greenhouse/${token}${mark}`);
    if (r.status === 200) {
      for (const raw of r.jobs) listed.push(summarizeJob("greenhouse", token, raw));
    }
    await sleep(PAUSE_MS);
  }
  for (const token of ashbyTokens) {
    const r = await probeBoard("ashby", token);
    boards[token] = { ok: r.status === 200, status: r.status, count: r.count, source: "ashby", err: r.err };
    const mark = r.status === 200 ? "" : "  FAIL";
    console.log(`  ${String(r.status).padStart(3)}  n=${String(r.count).padStart(4)}  ashby/${token}${mark}`);
    if (r.status === 200) {
      for (const raw of r.jobs) listed.push(summarizeJob("ashby", token, raw));
    }
    await sleep(PAUSE_MS);
  }

  const classified = listed.map((j) => {
    const cls = classifyTitle(j.title);
    return { ...j, titleBand: cls?.band || null, titleWhy: cls?.why || "" };
  });
  const pitfalls = classified.filter((j) => j.titleBand === "pitfall");
  const survivors = classified.filter((j) => j.titleBand === "core" || j.titleBand === "stretch");
  const toFetch = rankForFetch(survivors).slice(0, FETCH_CAP);

  console.log(
    `\ntitle prefilter: ${survivors.length} survivors (${survivors.filter((j) => j.titleBand === "core").length} core, ${survivors.filter((j) => j.titleBand === "stretch").length} stretch), ${pitfalls.length} pitfalls vetoed, fetching ${toFetch.length}≤${FETCH_CAP}`,
  );
  if (VERBOSE) {
    for (const j of toFetch) {
      console.log(`  [${j.titleBand}] ${j.source}/${j.token}: ${j.title}  |  ${j.location}`);
    }
  }

  const scored = [];
  for (const job of toFetch) {
    try {
      const text = await fetchContent(job);
      scored.push(attachScore(job, text));
    } catch (e) {
      console.error(`  fetch fail ${job.source}/${job.token}/${job.id}: ${e.message}`);
    }
    await sleep(PAUSE_MS);
  }

  const shortlist = selectShortlist(scored, CARD_CAP);
  const date = today();
  const md = renderShortlist(shortlist, { date });
  fs.mkdirSync(path.join(ROOT, "inbox"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "inbox/shortlist.md"), md);
  const raw = {
    pulled_at: nowIso(),
    sources: ["greenhouse job board API", "ashby posting API"],
    boards,
    title_survivors: survivors.map((j) => ({
      source: j.source,
      token: j.token,
      id: j.id,
      title: j.title,
      location: j.location,
      url: j.url,
      band: j.titleBand,
    })),
    fetched: scored.length,
    cards: scored.map((c) => ({
      id: c.id,
      company: c.company,
      title: c.displayTitle,
      location: c.location,
      url: c.url,
      decision: c.decision,
      band: c.bandNote,
      geo: c.geo,
      geoWhy: c.geoWhy,
      skipHits: c.skipHits,
      honestHeadline: c.honestHeadline,
    })),
    shortlist: shortlist.map((c) => ({ id: c.id, decision: c.decision, title: c.displayTitle })),
    prep_count: shortlist.filter((c) => c.decision === "Prep").length,
    notes: [
      "Title pitfalls vetoed before content fetch.",
      "Empty Prep is a valid market+prefs result.",
    ],
  };
  const rawPath = path.join(ROOT, "inbox", `raw-${date}.json`);
  fs.writeFileSync(rawPath, JSON.stringify(raw, null, 2) + "\n");

  console.log(`\nwrote inbox/shortlist.md (${shortlist.length} cards, Prep=${raw.prep_count})`);
  console.log(`wrote ${path.relative(ROOT, rawPath)}`);
  for (const c of shortlist) {
    console.log(`  ${c.decision.padEnd(5)}  ${c.company} — ${c.displayTitle}`);
  }
  if (shortlist.length === 0) console.log("  (empty shortlist is a valid result)");

  return { shortlist, raw };
}

const replay = runReplay();
if (!replay.ok) process.exit(1);
if (REPLAY_ONLY) {
  console.log("replay-only: ok");
  process.exit(0);
}

await ingest();
