import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { scoreJob } from "../scripts/lib/radar.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prefs = yaml.load(fs.readFileSync(path.join(root, "examples/software-engineer/inbox/prefs.yaml"), "utf8"));
const fixture = JSON.parse(fs.readFileSync(path.join(root, "examples/software-engineer/scripts/fixtures/replay.json"), "utf8"));

for (const job of fixture.jobs) {
  test(`fictional radar fixture ${job.id} scores ${job.expected}`, () => {
    assert.equal(scoreJob(job, prefs).decision, job.expected);
  });
}

test("geography decisions change through configuration, not code", () => {
  const job = { title: "Senior Backend Engineer", location: "Toronto, Canada", text: "Backend APIs" };
  assert.equal(scoreJob(job, prefs).decision, "Later");
  const configured = structuredClone(prefs);
  configured.geo.accept_terms.push("canada");
  assert.equal(scoreJob(job, configured).decision, "Prep");
});
