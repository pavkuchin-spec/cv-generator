#!/usr/bin/env node
// Builds onepager.pdf, appendix.pdf, and cv-plain.txt for a variant.
// Usage: node build.mjs <variant-slug> [--autofit]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { marked } from "marked";
import puppeteer from "puppeteer-core";
import { PDFDocument } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PX_PER_MM = 96 / 25.4; // CSS reference pixels
const PAGE_HEIGHT_MM = 297;
const AUTOFIT_SCALES = [1.0, 0.985, 0.97, 0.955, 0.94];

// .title in onepager.css is uppercase with 3.5pt letter-spacing, so it wraps
// (and blows the one-page budget) well before a normal sentence would.
const HEADLINE_MAX_CHARS = 42;

// Bullet-quality lint. Advisory only — the one-page overflow check is still the
// only thing that fails a build. See research/resume-writing-notes/.
const WEAK_OPENERS =
  /^\s*(responsible for|worked on|participated in|involved in|helped with|tasked with|assisted (with|in))\b/i;
// Deliberately separate: the guide's step 3 (scale) and step 5 (result) are
// different rungs, and a bullet that only states volume has not made the jump.
const SCALE_SIGNALS = /\d/;
// Stems, not exact forms — "retired" vs "retiring" is not a distinction the
// lint should care about, and matching whole words re-introduces that gap.
const RESULT_SIGNALS =
  /\breduc|\bcut(ting|s)?\b|\benabl|\bunblock|\bapprov|\bdeliver|\bretir|\beliminat|\bsav(ing|ed|es)\b|\bprevent|\bshrank\b|\bfree(d|ing)\b|\bresulting in\b|\bso that\b/i;

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function readYaml(p) {
  return yaml.load(fs.readFileSync(p, "utf8"));
}

function fileUrl(p) {
  return "file://" + path.resolve(p);
}

// Chrome blocks file:// subresources (stylesheets, fonts) when the document
// itself was loaded via page.setContent() (origin is opaque "about:blank").
// Writing the rendered HTML into templates/ as a sibling of the CSS and
// navigating to it with page.goto() gives the document a real file:// origin,
// so the plain relative href="onepager.css" resolves normally.
async function renderViaTempFile(browser, templateDir, html) {
  const tmpPath = path.join(templateDir, `.render-${process.pid}-${Date.now()}.html`);
  fs.writeFileSync(tmpPath, html);
  try {
    const page = await browser.newPage();
    await page.goto(fileUrl(tmpPath), { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");
    return page;
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- one-pager HTML assembly ----

function renderExpertise(expertise) {
  return Object.entries(expertise)
    .map(
      ([group, items]) => `
      <div class="expertise-group">
        <h4>${esc(group)}:</h4>
        <ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>`
    )
    .join("");
}

function renderEducation(education) {
  return education
    .map(
      (e) => `
      <div class="edu-item">
        <div class="degree">${esc(e.degree)}</div>
        <div class="school">${esc(e.school)}</div>
        <div class="dates">${esc(e.dates)}</div>
        <div>${esc(e.field)}</div>
      </div>`
    )
    .join("");
}

function renderLeftColumn(profile, expertise) {
  const c = profile.contact;
  return `
    <div class="section">
      <div class="section-title">Contact</div>
      <ul class="contact-list">
        <li>${esc(c.phone)}</li>
        <li>${esc(c.email)}</li>
        <li>${esc(c.linkedin)}</li>
        <li>${esc(c.location)}</li>
        <li>${esc(c.telegram)}</li>
      </ul>
    </div>
    <div class="section">
      <div class="section-title">Expertise</div>
      ${renderExpertise(expertise)}
    </div>
    <div class="section">
      <div class="section-title">Education</div>
      ${renderEducation(profile.education)}
    </div>
    <div class="section">
      <div class="section-title">Certifications</div>
      <ul class="cert-list">${profile.certifications.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    </div>`;
}

function renderBullet(b) {
  if (typeof b === "string") return `<li>${esc(b)}</li>`;
  return `<li><b>${esc(b.label)}</b>: ${esc(b.text)}</li>`;
}

function renderRole(role) {
  return `
    <div class="role">
      <div class="role-head">
        <span class="role-title">${esc(role.title)}</span>
        <span class="role-dates">${esc(role.dates)}</span>
      </div>
      <div class="role-employer">${esc(role.employer)}</div>
      ${role.intro ? `<div class="role-intro">${esc(role.intro)}</div>` : ""}
      <ul class="role-bullets">${role.bullets.map(renderBullet).join("")}</ul>
    </div>`;
}

function renderRightColumn(profileText, roles) {
  return `
    <div class="section-title">Profile</div>
    <p class="profile-text">${esc(profileText)}</p>
    <div class="section-title">Work Experience</div>
    ${roles.map(renderRole).join("")}`;
}

// Overrides are patches, not a replacement list: a variant naming only one
// role must leave every other role from profile.yaml untouched, in its
// original order and count.
function mergeRoles(baseRoles, overrides) {
  if (!overrides) return baseRoles;
  const overrideByKey = new Map(overrides.map((o) => [`${o.employer}::${o.title}`, o]));
  const seen = new Set();
  const merged = baseRoles.map((base) => {
    const key = `${base.employer}::${base.title}`;
    const o = overrideByKey.get(key);
    if (!o) return base;
    seen.add(key);
    return { ...base, bullets: o.bullets || base.bullets, intro: o.intro ?? base.intro };
  });
  for (const o of overrides) {
    const key = `${o.employer}::${o.title}`;
    if (!seen.has(key)) fail(`onepager.yaml role override references unknown role: ${o.employer} / ${o.title}`);
  }
  return merged;
}

// The header line under the name is a *positioning* claim (which role this
// application presents Pavel as), not a factual one — unlike the role titles
// inside Work Experience, which come from profile.yaml and never change.
// CLAUDE.md carries the honesty guard on what a headline may say.
function resolveHeadline(profile, variantYaml) {
  const headline = variantYaml.headline || profile.headline_default || profile.title;
  if (headline.length > HEADLINE_MAX_CHARS) {
    console.log(
      `  ⚠ headline is ${headline.length} chars (soft limit ${HEADLINE_MAX_CHARS}) — ` +
        `it may wrap in the header and eat one-page budget`
    );
  }
  return headline;
}

// Like mergeRoles: a patch, not a replacement. A variant may drop or reorder
// expertise groups and items to narrow the CV to one clear role (and to satisfy
// step 3 of CLAUDE.md's cut order), but every item must already exist verbatim
// in that group in profile.yaml — so this surface can never invent a skill.
function mergeExpertise(baseExpertise, override) {
  if (!override) return baseExpertise;
  const merged = {};
  for (const [group, items] of Object.entries(override)) {
    const baseItems = baseExpertise[group];
    if (!baseItems) {
      fail(`onepager.yaml expertise override references unknown group: "${group}"`);
    }
    if (!Array.isArray(items) || items.length === 0) {
      fail(`onepager.yaml expertise override for "${group}" must be a non-empty list`);
    }
    for (const item of items) {
      if (!baseItems.includes(item)) {
        fail(
          `onepager.yaml expertise override invents an item not in profile.yaml under "${group}": "${item}"\n` +
            `  allowed: ${baseItems.map((i) => `"${i}"`).join(", ")}`
        );
      }
    }
    merged[group] = items;
  }
  return merged;
}

// Guide slides 4-6: bullets should open with an active completed action and say
// what changed, not just what was done. Reported as warnings, never fatal —
// "no result dimension" is sometimes the honest answer for an older role.
function lintBullets(roles) {
  const findings = [];
  for (const role of roles) {
    for (const b of role.bullets) {
      const text = typeof b === "string" ? b : b.text;
      const snippet = `${text.slice(0, 58)}${text.length > 58 ? "…" : ""}`;
      const where = `${role.employer.split(" (")[0]} — "${snippet}"`;

      if (WEAK_OPENERS.test(text)) {
        findings.push({ code: "weak-verb", where });
      }
      const hasResult = RESULT_SIGNALS.test(text);
      const hasScale = SCALE_SIGNALS.test(text);
      if (!hasResult && !hasScale) {
        findings.push({ code: "no-result-no-scale", where });
      } else if (!hasResult) {
        findings.push({ code: "scale-only", where });
      }
    }
  }

  if (findings.length === 0) {
    console.log("  bullet lint: clean — every bullet states a result");
    return;
  }

  const labels = {
    "weak-verb": "weak opener; use an active completed action (built, shipped, led)",
    "no-result-no-scale": "states neither a result nor a scale — try the four lenses (scale / help / problems / leadership)",
    "scale-only": "states scale but not what changed — the step-3→step-5 jump",
  };
  console.log(`  bullet lint: ${findings.length} advisory finding(s) — does not fail the build`);
  for (const code of ["no-result-no-scale", "weak-verb", "scale-only"]) {
    const group = findings.filter((f) => f.code === code);
    if (group.length === 0) continue;
    console.log(`    ⚠ ${labels[code]}`);
    for (const f of group) console.log(`        ${f.where}`);
  }
}

async function buildOnepager(browser, profile, variantYaml, headline, outDir) {
  const templateDir = path.join(__dirname, "templates");
  const template = fs.readFileSync(path.join(templateDir, "onepager.html"), "utf8");
  const profileText = variantYaml.profile || profile.profile_default;
  const roles = mergeRoles(profile.roles, variantYaml.roles);
  const expertise = mergeExpertise(profile.expertise, variantYaml.expertise);

  let lastMeasuredOverflowMm = null;

  for (const scale of AUTOFIT_SCALES) {
    let html = template
      .replace(/\{\{NAME\}\}/g, esc(profile.name))
      .replace(/\{\{TITLE\}\}/g, esc(headline))
      .replace("{{SCALE}}", scale)
      .replace("{{LEFT_COLUMN}}", renderLeftColumn(profile, expertise))
      .replace("{{RIGHT_COLUMN}}", renderRightColumn(profileText, roles));

    const page = await renderViaTempFile(browser, templateDir, html);

    const heightPx = await page.evaluate(() => document.querySelector(".page").getBoundingClientRect().height);
    const heightMm = heightPx / PX_PER_MM;
    const overflowMm = heightMm - PAGE_HEIGHT_MM;

    const outPath = path.join(outDir, "onepager.pdf");
    await page.pdf({ path: outPath, printBackground: true, preferCSSPageSize: true });
    await page.close();

    const pdfDoc = await PDFDocument.load(fs.readFileSync(outPath));
    const pageCount = pdfDoc.getPageCount();

    if (pageCount === 1) {
      if (scale !== AUTOFIT_SCALES[0]) {
        console.log(`  onepager: fit at scale ${scale} (autofit)`);
      } else {
        console.log(`  onepager: fits at full scale (${heightMm.toFixed(1)}mm / 297mm)`);
      }
      lintBullets(roles);
      return;
    }
    lastMeasuredOverflowMm = overflowMm;
    console.log(`  onepager: scale ${scale} → ${pageCount} pages (overflow ~${overflowMm.toFixed(1)}mm), trying next scale...`);
  }

  fail(
    `one-pager overflowed by ~${lastMeasuredOverflowMm.toFixed(1)}mm even at smallest autofit scale (${AUTOFIT_SCALES.at(-1)}) — trim content.\n` +
      `  Cut order: profile prose → older-role bullets → expertise list items. Never cut contact, dates, or employers.`
  );
}

// ---- appendix ----

async function buildAppendix(browser, profile, headline, variantDir, outDir) {
  const mdPath = path.join(variantDir, "appendix.md");
  if (!fs.existsSync(mdPath)) {
    console.log("  appendix: no appendix.md found, skipping");
    return;
  }
  const md = fs.readFileSync(mdPath, "utf8");
  const contentHtml = marked.parse(md);
  const templateDir = path.join(__dirname, "templates");
  const template = fs.readFileSync(path.join(templateDir, "appendix.html"), "utf8");
  const c = profile.contact;
  const contactLine = [c.phone, c.email, c.linkedin, c.location].join("   ·   ");

  const html = template
    .replace(/\{\{NAME\}\}/g, esc(profile.name))
    .replace(/\{\{TITLE\}\}/g, esc(headline))
    .replace("{{CONTACT_LINE}}", esc(contactLine))
    .replace("{{CONTENT}}", contentHtml);

  const page = await renderViaTempFile(browser, templateDir, html);
  const outPath = path.join(outDir, "appendix.pdf");
  await page.pdf({ path: outPath, printBackground: true, preferCSSPageSize: true });
  await page.close();

  const pdfDoc = await PDFDocument.load(fs.readFileSync(outPath));
  console.log(`  appendix: ${pdfDoc.getPageCount()} pages`);
}

// ---- cover letter ----

// Same three-substitution shape as the appendix, different template. Optional:
// a variant with no cover-letter.md just doesn't get one.
async function buildCoverLetter(browser, profile, headline, variantDir, outDir) {
  const mdPath = path.join(variantDir, "cover-letter.md");
  if (!fs.existsSync(mdPath)) {
    console.log("  cover letter: no cover-letter.md found, skipping");
    return;
  }
  const contentHtml = marked.parse(fs.readFileSync(mdPath, "utf8"));
  const templateDir = path.join(__dirname, "templates");
  const template = fs.readFileSync(path.join(templateDir, "cover-letter.html"), "utf8");
  const c = profile.contact;
  const contactLine = [c.phone, c.email, c.linkedin, c.location].join("   ·   ");

  const html = template
    .replace(/\{\{NAME\}\}/g, esc(profile.name))
    .replace(/\{\{TITLE\}\}/g, esc(headline))
    .replace("{{CONTACT_LINE}}", esc(contactLine))
    .replace("{{CONTENT}}", contentHtml);

  const page = await renderViaTempFile(browser, templateDir, html);
  const outPath = path.join(outDir, "cover-letter.pdf");
  await page.pdf({ path: outPath, printBackground: true, preferCSSPageSize: true });
  await page.close();

  const pdfDoc = await PDFDocument.load(fs.readFileSync(outPath));
  const pageCount = pdfDoc.getPageCount();
  console.log(`  cover letter: ${pageCount} page${pageCount === 1 ? "" : "s"}`);
  if (pageCount > 1) {
    console.log("    ⚠ a cover letter should be three short paragraphs on one page — trim it");
  }
}

// ---- plain text (ATS safety net) ----

function buildPlainText(profile, variantYaml, headline, outDir) {
  const lines = [];
  lines.push(profile.name.toUpperCase());
  lines.push(headline);
  lines.push("");
  const c = profile.contact;
  lines.push([c.phone, c.email, c.linkedin, c.location, c.telegram].join(" | "));
  lines.push("");
  lines.push("PROFILE");
  lines.push(variantYaml.profile || profile.profile_default);
  lines.push("");
  lines.push("EXPERTISE");
  for (const [group, items] of Object.entries(mergeExpertise(profile.expertise, variantYaml.expertise))) {
    lines.push(`${group}: ${items.join(", ")}`);
  }
  lines.push("");
  lines.push("WORK EXPERIENCE");
  const roles = mergeRoles(profile.roles, variantYaml.roles);
  for (const r of roles) {
    lines.push("");
    lines.push(`${r.title} — ${r.employer} (${r.dates})`);
    if (r.intro) lines.push(r.intro);
    for (const b of r.bullets) {
      lines.push(typeof b === "string" ? `- ${b}` : `- ${b.label}: ${b.text}`);
    }
  }
  lines.push("");
  lines.push("EDUCATION");
  for (const e of profile.education) {
    lines.push(`${e.degree}, ${e.school} (${e.dates}) — ${e.field}`);
  }
  lines.push("");
  lines.push("CERTIFICATIONS");
  for (const cert of profile.certifications) lines.push(`- ${cert}`);
  lines.push("");

  const text = lines.join("\n");
  fs.writeFileSync(path.join(outDir, "cv-plain.txt"), text);
  console.log("  cv-plain.txt written");
  return text;
}

// ---- JD keyword coverage (ATS keyword match) ----

// Guide slide 4: screeners match the posting's own vocabulary against the CV.
// jd-keywords.yaml records the posting's phrases so the match is checkable
// instead of asserted. Advisory: a miss is often the honest answer (BigQuery,
// not Snowflake), so this never fails the build — read it and judge.
function normalizeKeyword(entry) {
  if (typeof entry === "string") return { term: entry, aliases: [] };
  if (!entry || !entry.term) fail(`jd-keywords.yaml entry must be a string or have a "term": ${JSON.stringify(entry)}`);
  return { term: entry.term, aliases: entry.aliases || [] };
}

function reportKeywordCoverage(variantDir, onepagerText, appendixMd) {
  const kwPath = path.join(variantDir, "jd-keywords.yaml");
  if (!fs.existsSync(kwPath)) return;

  const kw = readYaml(kwPath) || {};
  const onepagerHay = onepagerText.toLowerCase();
  const appendixHay = (appendixMd || "").toLowerCase();

  for (const bucket of ["must_have", "nice_to_have"]) {
    const entries = (kw[bucket] || []).map(normalizeKeyword);
    if (entries.length === 0) continue;

    const results = entries.map(({ term, aliases }) => {
      const forms = [term, ...aliases].map((f) => f.toLowerCase());
      return {
        term,
        onepager: forms.some((f) => onepagerHay.includes(f)),
        appendix: forms.some((f) => appendixHay.includes(f)),
      };
    });
    const hits = results.filter((r) => r.onepager || r.appendix);
    const pct = Math.round((hits.length / results.length) * 100);

    console.log(`  keyword coverage (${bucket.replaceAll("_", "-")}): ${hits.length}/${results.length} (${pct}%)`);
    for (const r of results) {
      const surfaces = [r.onepager && "1p", r.appendix && "apx"].filter(Boolean).join("+");
      console.log(`    ${surfaces ? `✓ ${r.term}  [${surfaces}]` : `✗ ${r.term}`}`);
    }
    if (bucket === "must_have" && hits.length < results.length) {
      console.log("    ⚠ missing must-have terms — add them only if the evidence bank backs them,");
      console.log("      otherwise record the gap in rationale.md");
    }
  }
}

// ---- main ----

async function main() {
  const variantSlug = process.argv[2];
  if (!variantSlug) fail("usage: node build.mjs <variant-slug> [--autofit]");

  const variantDir = path.join(__dirname, "variants", variantSlug);
  if (!fs.existsSync(variantDir)) fail(`no such variant: variants/${variantSlug}`);

  const outDir = path.join(variantDir, "out");
  fs.mkdirSync(outDir, { recursive: true });

  const profile = readYaml(path.join(__dirname, "data/profile.yaml"));
  const onepagerYamlPath = path.join(variantDir, "onepager.yaml");
  const variantYaml = fs.existsSync(onepagerYamlPath) ? readYaml(onepagerYamlPath) || {} : {};

  if (!fs.existsSync(CHROME_PATH)) fail(`system Chrome not found at ${CHROME_PATH}`);

  console.log(`Building variant "${variantSlug}"...`);
  const headline = resolveHeadline(profile, variantYaml);
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    await buildOnepager(browser, profile, variantYaml, headline, outDir);
    await buildAppendix(browser, profile, headline, variantDir, outDir);
    await buildCoverLetter(browser, profile, headline, variantDir, outDir);
  } finally {
    await browser.close();
  }
  const plainText = buildPlainText(profile, variantYaml, headline, outDir);

  const appendixPath = path.join(variantDir, "appendix.md");
  const appendixMd = fs.existsSync(appendixPath) ? fs.readFileSync(appendixPath, "utf8") : "";
  reportKeywordCoverage(variantDir, plainText, appendixMd);

  console.log(`\nDone. Output in variants/${variantSlug}/out/`);
}

main().catch((err) => fail(err.stack || err.message));
