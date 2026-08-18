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

function renderLeftColumn(profile) {
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
      ${renderExpertise(profile.expertise)}
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

async function buildOnepager(browser, profile, variantYaml, outDir) {
  const templateDir = path.join(__dirname, "templates");
  const template = fs.readFileSync(path.join(templateDir, "onepager.html"), "utf8");
  const profileText = variantYaml.profile || profile.profile_default;
  const roles = mergeRoles(profile.roles, variantYaml.roles);

  let lastMeasuredOverflowMm = null;

  for (const scale of AUTOFIT_SCALES) {
    let html = template
      .replace(/\{\{NAME\}\}/g, esc(profile.name))
      .replace(/\{\{TITLE\}\}/g, esc(profile.title))
      .replace("{{SCALE}}", scale)
      .replace("{{LEFT_COLUMN}}", renderLeftColumn(profile))
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

async function buildAppendix(browser, profile, variantDir, outDir) {
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
    .replace(/\{\{TITLE\}\}/g, esc(profile.title))
    .replace("{{CONTACT_LINE}}", esc(contactLine))
    .replace("{{CONTENT}}", contentHtml);

  const page = await renderViaTempFile(browser, templateDir, html);
  const outPath = path.join(outDir, "appendix.pdf");
  await page.pdf({ path: outPath, printBackground: true, preferCSSPageSize: true });
  await page.close();

  const pdfDoc = await PDFDocument.load(fs.readFileSync(outPath));
  console.log(`  appendix: ${pdfDoc.getPageCount()} pages`);
}

// ---- plain text (ATS safety net) ----

function buildPlainText(profile, variantYaml, outDir) {
  const lines = [];
  lines.push(profile.name.toUpperCase());
  lines.push(profile.title);
  lines.push("");
  const c = profile.contact;
  lines.push([c.phone, c.email, c.linkedin, c.location, c.telegram].join(" | "));
  lines.push("");
  lines.push("PROFILE");
  lines.push(variantYaml.profile || profile.profile_default);
  lines.push("");
  lines.push("EXPERTISE");
  for (const [group, items] of Object.entries(profile.expertise)) {
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

  fs.writeFileSync(path.join(outDir, "cv-plain.txt"), lines.join("\n"));
  console.log("  cv-plain.txt written");
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
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    await buildOnepager(browser, profile, variantYaml, outDir);
    await buildAppendix(browser, profile, variantDir, outDir);
  } finally {
    await browser.close();
  }
  buildPlainText(profile, variantYaml, outDir);

  console.log(`\nDone. Output in variants/${variantSlug}/out/`);
}

main().catch((err) => fail(err.stack || err.message));
