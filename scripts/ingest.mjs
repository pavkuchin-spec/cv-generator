#!/usr/bin/env node
// Configurable job-board ingest. Replay mode is offline and deterministic.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import {
  classifyTitle,
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
import { resolveWorkspace } from "./lib/workspace.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resolved = resolveWorkspace({ root });
const workspaceDir = resolved.workspaceDir;
const flags = new Set(resolved.args);
const inboxDir = path.join(workspaceDir, "inbox");
const prefsPath = path.join(inboxDir, "prefs.yaml");
const fixturePath = path.join(workspaceDir, "scripts/fixtures/replay.json");
const prefs = yaml.load(fs.readFileSync(prefsPath, "utf8")) || {};
const fetchCap = Number(prefs.fetch_cap || 15);
const cardCap = Number(prefs.card_cap || 5);
const timezone = prefs.timezone || "UTC";
const verbose = flags.has("--verbose") || process.env.VERBOSE === "1";
const replayOnly = flags.has("--replay-only");
const userAgent = "cv-generator-ingest/2.0";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": userAgent } });
  let body = null;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
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
  return path.join(inboxDir, source === "ashby" ? "_ashby" : "_gh", `${token}-${id}.json`);
}

function writeCache(source, token, id, raw) {
  const target = cachePath(source, token, id);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(raw));
}

function attachScore(job, text) {
  return { ...job, text, ...scoreJob({ ...job, text }, prefs) };
}

function runReplay() {
  if (!fs.existsSync(fixturePath)) {
    console.log("replay: skipped (workspace has no scripts/fixtures/replay.json)");
    return true;
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const failures = [];
  const cards = (fixture.jobs || []).map((job) => ({ ...job, ...scoreJob(job, prefs) }));
  console.log(`replay: ${cards.length} fictional JDs`);
  cards.forEach((card, index) => {
    const expected = fixture.jobs[index].expected;
    console.log(`  ${card.decision.padEnd(5)}  ${card.company} - ${card.displayTitle}`);
    if (expected && card.decision !== expected) failures.push(`${card.id}: ${card.decision}, expected ${expected}`);
  });
  if (failures.length) {
    failures.forEach((failure) => console.error(`  ${failure}`));
    return false;
  }
  return true;
}

async function probeBoard(source, token) {
  const url = source === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`
    : `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`;
  try {
    const { status, body } = await getJson(url);
    return { source, token, status, jobs: status === 200 ? body?.jobs || [] : [] };
  } catch (error) {
    return { source, token, status: 0, jobs: [], error: error.message };
  }
}

async function fetchContent(job) {
  if (job.source === "ashby" || job.raw.content) return jobText(job.source, job.raw);
  const cached = cachePath(job.source, job.token, job.id);
  if (fs.existsSync(cached)) return jobText(job.source, JSON.parse(fs.readFileSync(cached, "utf8")));
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(job.token)}/jobs/${encodeURIComponent(job.id)}`;
  const { status, body } = await getJson(url);
  if (status !== 200 || !body) throw new Error(`HTTP ${status}`);
  writeCache(job.source, job.token, job.id, body);
  return jobText(job.source, body);
}

async function ingest() {
  const dead = new Set((prefs.watchlist_dead?.greenhouse || []).map(String));
  const sources = [
    ...(prefs.watchlist_greenhouse || []).filter((token) => !dead.has(String(token))).map((token) => ["greenhouse", String(token)]),
    ...(prefs.watchlist_ashby || []).map((token) => ["ashby", String(token)]),
  ];
  console.log(`ingest - ${sources.length} configured boards`);

  const listed = [];
  const boards = {};
  for (const [source, token] of sources) {
    const result = await probeBoard(source, token);
    boards[`${source}/${token}`] = { status: result.status, count: result.jobs.length, error: result.error || null };
    console.log(`  ${String(result.status).padStart(3)}  n=${String(result.jobs.length).padStart(4)}  ${source}/${token}`);
    for (const raw of result.jobs) listed.push(summarizeJob(source, token, raw));
  }

  const classified = listed.map((job) => {
    const classification = classifyTitle(job.title, prefs);
    return { ...job, titleBand: classification?.band || null, titleWhy: classification?.why || "" };
  });
  const survivors = classified.filter((job) => job.titleBand === "core" || job.titleBand === "stretch");
  const toFetch = rankForFetch(survivors, prefs).slice(0, fetchCap);
  if (verbose) toFetch.forEach((job) => console.log(`  [${job.titleBand}] ${job.title} | ${job.location}`));

  const scored = [];
  for (const job of toFetch) {
    try { scored.push(attachScore(job, await fetchContent(job))); }
    catch (error) { console.error(`  fetch failed ${job.token}/${job.id}: ${error.message}`); }
  }

  const shortlist = selectShortlist(scored, cardCap);
  fs.mkdirSync(inboxDir, { recursive: true });
  fs.writeFileSync(path.join(inboxDir, "shortlist.md"), renderShortlist(shortlist, { date: today() }));
  const report = {
    pulled_at: new Date().toISOString(),
    workspace: path.basename(workspaceDir),
    boards,
    fetched: scored.length,
    cards: scored.map(({ id, company, displayTitle, location, url, decision, bandNote, geo, geoWhy }) => ({ id, company, title: displayTitle, location, url, decision, band: bandNote, geo, geoWhy })),
  };
  const reportPath = path.join(inboxDir, `raw-${today()}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote ${path.relative(root, reportPath)} and shortlist.md`);
}

if (!runReplay()) process.exit(1);
if (replayOnly) {
  console.log("replay-only: ok");
} else {
  await ingest();
}
