import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const SECTION_ORDER = ["Contact", "Profile", "Expertise", "Work Experience", "Education", "Certifications"];

export function normalizeText(value) {
  return String(value)
    .normalize("NFKC")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\p{L}(?:\s+\p{L}){2,}(?!\p{L})/gu, (letters) => letters.replace(/\s+/g, ""))
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en");
}

export function coreFacts(content) {
  const facts = [{ path: "profile.name", value: content.name }];
  for (const [key, value] of Object.entries(content.contact)) {
    if (value) facts.push({ path: `profile.contact.${key}`, value });
  }
  content.roles.forEach((role, index) => {
    for (const key of ["employer", "title", "dates"]) {
      if (role[key]) facts.push({ path: `profile.roles[${index}].${key}`, value: role[key] });
    }
  });
  content.education.forEach((education, index) => {
    for (const key of ["degree", "school", "dates"]) {
      if (education[key]) facts.push({ path: `profile.education[${index}].${key}`, value: education[key] });
    }
  });
  return facts;
}

export function compareCoreFacts(extractedText, content) {
  const text = normalizeText(extractedText);
  const facts = coreFacts(content);
  return {
    checked: facts.length,
    missing: facts.filter(({ value }) => !text.includes(normalizeText(value))).map(({ path }) => path),
  };
}

export function analyzeSectionOrder(extractedText) {
  const text = normalizeText(extractedText);
  const observed = SECTION_ORDER
    .map((heading) => ({ heading, index: text.indexOf(normalizeText(heading)) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index)
    .map(({ heading }) => heading);
  const missing = SECTION_ORDER.filter((heading) => !observed.includes(heading));
  const warnings = missing.map((heading) => `Section heading not found: ${heading}`);
  let previous = -1;
  for (const heading of observed) {
    const current = SECTION_ORDER.indexOf(heading);
    if (current < previous) warnings.push(`Section appears out of expected order: ${heading}`);
    previous = current;
  }
  return { expected: SECTION_ORDER, observed, warnings };
}

export function createEvidenceReport(extractedText, content, layout) {
  const core = compareCoreFacts(extractedText, content);
  return {
    status: core.missing.length ? "fail" : "pass",
    layout,
    extractor: "pdfjs-dist",
    extraction: "success",
    coreFacts: core,
    sectionOrder: analyzeSectionOrder(extractedText),
    limits: "Verifies text extraction from this PDF. Section order is advisory; commercial ATS behavior is untested.",
  };
}

export async function extractPdfText(pdfPath) {
  let task;
  try {
    task = getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) });
    const document = await task.promise;
    if (document.numPages !== 1) throw new Error(`expected one PDF page; found ${document.numPages}`);
    const page = await document.getPage(1);
    const { items } = await page.getTextContent();
    const text = items.map((item) => normalizeText(item.str ?? "")).filter(Boolean).join(" ");
    page.cleanup();
    if (!text) throw new Error("PDF text extraction returned no text");
    return text;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  } finally {
    await task?.destroy();
  }
}

export async function verifyPdf(pdfPath, content, layout) {
  try {
    return createEvidenceReport(await extractPdfText(pdfPath), content, layout);
  } catch (error) {
    return {
      status: "fail", layout, extractor: "pdfjs-dist", extraction: "error",
      error: error.message, coreFacts: { checked: 0, missing: [] },
      sectionOrder: { expected: SECTION_ORDER, observed: [], warnings: [] },
      limits: "PDF text extraction failed; commercial ATS behavior is untested.",
    };
  }
}

export function assertEvidence(report) {
  if (report.status === "pass") return;
  const detail = report.extraction === "error" ? report.error : `missing core facts: ${report.coreFacts.missing.join(", ")}`;
  throw new Error(`ATS PDF evidence failed: ${detail}`);
}
