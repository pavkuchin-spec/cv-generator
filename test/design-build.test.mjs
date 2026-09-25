import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("fictional CV builds in both layouts and page sizes without changing plain text", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "cv-design-build-"));
  try {
    fs.cpSync(path.join(root, "examples/software-engineer"), workspace, { recursive: true, filter: (item) => !item.split(path.sep).includes("out") });
    const variants = {
      classic: "",
      oneA4: "layout: one-column\n",
      oneLetter: "layout: one-column\npage:\n  size: letter\n",
      twoLetter: "page:\n  size: letter\n",
    };
    const texts = [];
    for (const [slug, design] of Object.entries(variants)) {
      const dir = path.join(workspace, "variants", slug);
      fs.cpSync(path.join(workspace, "variants/_base"), dir, { recursive: true });
      if (design) fs.writeFileSync(path.join(dir, "design.yaml"), design);
      const result = spawnSync(process.execPath, [path.join(root, "build.mjs"), slug, "--workspace", workspace], { cwd: root, encoding: "utf8", env: process.env });
      assert.equal(result.status, 0, `${slug}: ${result.stdout}\n${result.stderr}`);
      const pdf = await PDFDocument.load(fs.readFileSync(path.join(dir, "out/onepager.pdf")));
      assert.equal(pdf.getPageCount(), 1, slug);
      const evidence = JSON.parse(fs.readFileSync(path.join(dir, "out/ats-evidence.json"), "utf8"));
      assert.equal(evidence.status, "pass", `${slug}: ${JSON.stringify(evidence.coreFacts)}`);
      assert.equal(evidence.layout, slug.startsWith("one") ? "one-column" : "two-column");
      assert.ok(evidence.coreFacts.checked > 0);
      assert.deepEqual(evidence.coreFacts.missing, []);
      assert.ok(Array.isArray(evidence.sectionOrder.warnings));
      if (slug.startsWith("one")) assert.deepEqual(evidence.sectionOrder.warnings, []);
      else assert.ok(evidence.sectionOrder.warnings.some((warning) => warning.includes("Profile")));
      const { width, height } = pdf.getPage(0).getSize();
      assert.ok(Math.abs(width - (slug.endsWith("Letter") ? 612 : 595)) < 1, slug);
      assert.ok(Math.abs(height - (slug.endsWith("Letter") ? 792 : 842)) < 1, slug);
      texts.push(fs.readFileSync(path.join(dir, "out/cv-plain.txt"), "utf8"));
    }
    for (const content of texts.slice(1)) assert.equal(content, texts[0]);

    const source = path.join(workspace, "variants/oneA4/onepager.yaml");
    const before = fs.readFileSync(source);
    const rebuild = spawnSync(process.execPath, [path.join(root, "scripts/rebuild.mjs"), "oneA4", "--workspace", workspace], { cwd: root, encoding: "utf8", env: process.env });
    assert.equal(rebuild.status, 0, `${rebuild.stdout}\n${rebuild.stderr}`);
    assert.deepEqual(fs.readFileSync(source), before);
    assert.equal(JSON.parse(fs.readFileSync(path.join(workspace, "variants/oneA4/out/ats-evidence.json"), "utf8")).status, "pass");

    const overflow = path.join(workspace, "variants/overflow");
    fs.cpSync(path.join(workspace, "variants/_base"), overflow, { recursive: true });
    fs.writeFileSync(path.join(overflow, "design.yaml"), "layout: one-column\npage:\n  size: letter\n  marginY: 30\nfonts:\n  bodySize: 12\n");
    const failure = spawnSync(process.execPath, [path.join(root, "build.mjs"), "overflow", "--workspace", workspace], { cwd: root, encoding: "utf8", env: process.env });
    assert.notEqual(failure.status, 0);
    assert.match(failure.stderr, /overflowed/);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});
