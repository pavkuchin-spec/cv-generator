import assert from "node:assert/strict";
import test from "node:test";
import { mergeExpertise, selectCertifications } from "../scripts/lib/content-selection.mjs";

const inventory = { Technical: ["Python", "MCP"] };
const manual = { Technical: ["Agentic AI, MCP, RAG"] };

test("ordinary builds reject manual expertise outside the profile inventory", () => {
  assert.throws(() => mergeExpertise(inventory, manual), /not in profile.yaml/);
  assert.throws(() => mergeExpertise(inventory, { AI: ["MCP"] }), /unknown group/);
  assert.deepEqual(mergeExpertise(inventory, { Technical: ["MCP"] }), { Technical: ["MCP"] });
});

test("review-free selection retains manually grouped expertise verbatim", () => {
  assert.deepEqual(mergeExpertise(inventory, manual, { skipReview: true }), manual);
  const customGroup = { AI: ["MCP"] };
  assert.deepEqual(mergeExpertise(inventory, customGroup, { skipReview: true }), customGroup);
});

test("content structure remains required when inventory review is skipped", () => {
  for (const invalid of [[], "AI", { Technical: "Python" }, { Technical: [] }, { Technical: [42] }]) {
    assert.throws(() => mergeExpertise(inventory, invalid, { skipReview: true }), /mapping|list of strings/);
  }
  assert.throws(() => selectCertifications([], "Example Certificate", { skipReview: true }), /list of strings/);
});

test("certification selection is checked normally and editable in human mode", () => {
  assert.deepEqual(selectCertifications(["Example Certificate"], undefined), ["Example Certificate"]);
  assert.deepEqual(selectCertifications(["Example Certificate"], []), []);
  assert.throws(() => selectCertifications([], ["Example Certificate"]), /subset/);
  assert.deepEqual(selectCertifications([], ["Example Certificate"], { skipReview: true }), ["Example Certificate"]);
});
