import assert from "node:assert/strict";
import test from "node:test";
import { PRESETS, resolveDesign, pageDimensions, designCss } from "../scripts/lib/design.mjs";

test("no configuration keeps the legacy two-column A4 tokens", () => {
  assert.deepEqual(resolveDesign(), PRESETS.classic);
  assert.equal(resolveDesign().spacing.sidebarWidth, 55);
  assert.deepEqual(pageDimensions(resolveDesign()), { width: 210, height: 297 });
});

test("variant settings override workspace settings by key", () => {
  const design = resolveDesign(
    { preset: "compact", colors: { ink: "#123456", rule: "#654321" }, page: { size: "letter" } },
    { layout: "two-column", colors: { ink: "#abcdef" }, page: { marginY: 12 } },
  );
  assert.equal(design.layout, "two-column");
  assert.equal(design.colors.ink, "#abcdef");
  assert.equal(design.colors.rule, "#654321");
  assert.equal(design.page.size, "letter");
  assert.equal(design.page.marginY, 12);
  assert.deepEqual(pageDimensions(design), { width: 215.9, height: 279.4 });
  assert.match(designCss(design, 1), /size:215.9mm 279.4mm/);
});

test("invalid design settings identify the setting", () => {
  for (const [config, setting] of [
    [{ layout: "three-column" }, "design.layout"],
    [{ page: { size: "legal" } }, "design.page.size"],
    [{ page: { marginX: 1 } }, "design.page.marginX"],
    [{ fonts: { body: "RemoteFont" } }, "design.fonts.body"],
    [{ fonts: { nameSize: 50 } }, "design.fonts.nameSize"],
    [{ colors: { ink: "red" } }, "design.colors.ink"],
    [{ spacing: { columnGap: -1 } }, "design.spacing.columnGap"],
    [{ sections: { ruleStyle: "wavy" } }, "design.sections.ruleStyle"],
    [{ mystery: 1 }, "design.mystery"],
  ]) assert.throws(() => resolveDesign({}, config), new RegExp(setting.replaceAll(".", "\\.")));
});
