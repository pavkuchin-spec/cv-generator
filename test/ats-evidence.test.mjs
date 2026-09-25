import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertEvidence, compareCoreFacts, createEvidenceReport, extractPdfText, normalizeText, verifyPdf } from "../scripts/lib/ats-evidence.mjs";

const content = {
  name: "Éloïse Rowan",
  contact: { email: "eloise@example.com", phone: "+1 202-555-0147" },
  roles: [{ employer: "Example Labs", title: "Senior Engineer", dates: "2022–Present" }],
  education: [{ degree: "BSc Computer Science", school: "Example University", dates: "2013–2017" }],
};

const extracted = "É L O Ï S E ROWAN Contact eloise@example.com +1 202-555-0147 Profile Expertise Work Experience Senior Engineer 2022-Present Example Labs Education BSc Computer Science Example University 2013-2017 Certifications";

test("core facts match wrapped, Unicode, and typographic text", () => {
  assert.equal(normalizeText("2022–Present"), "2022-present");
  assert.deepEqual(compareCoreFacts(extracted.replace("Computer Science", "Computer\nScience"), content).missing, []);
});

test("missing facts report field paths without copying values", () => {
  const result = compareCoreFacts(extracted.replace("Example University", "Other University"), content);
  assert.deepEqual(result.missing, ["profile.education[0].school"]);
  assert.ok(!JSON.stringify(result).includes("Example University"));
  assert.throws(() => assertEvidence(createEvidenceReport(extracted.replace("Example University", "Other University"), content, "one-column")), /profile\.education\[0\]\.school/);
});

test("section order warnings remain advisory when core facts pass", () => {
  const report = createEvidenceReport(extracted.replace("Profile Expertise", "Expertise Profile"), content, "one-column");
  assert.equal(report.status, "pass");
  assert.equal(report.layout, "one-column");
  assert.ok(report.sectionOrder.warnings.some((warning) => warning.includes("Profile")));
  assert.match(report.limits, /commercial ATS behavior is untested/);
});

test("unreadable PDF fails extraction with an explicit report", async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ats-bad-pdf-")), "broken.pdf");
  try {
    fs.writeFileSync(file, "not a PDF");
    await assert.rejects(extractPdfText(file), /PDF text extraction failed/);
    const report = await verifyPdf(file, content, "two-column");
    assert.equal(report.status, "fail");
    assert.equal(report.extraction, "error");
    assert.throws(() => assertEvidence(report), /PDF text extraction failed/);
  } finally {
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  }
});
