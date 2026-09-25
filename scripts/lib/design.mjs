import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export const PRESETS = Object.freeze({
  classic: {
    layout: "two-column", page: { size: "a4", marginX: 16, marginY: 14 },
    fonts: { body: "Roboto", heading: "Hanken Grotesk", bodySize: 8.3, profileSize: 8.6, nameSize: 30, titleSize: 11, sectionSize: 9.5 },
    colors: { ink: "#2b2b2b", muted: "#555555", rule: "#2b2b2b", accent: "#3a3a3a", sidebarRule: "#cfcfcf" },
    spacing: { header: 8, section: 6, role: 4.5, columnGap: 8, sidebarWidth: 55 },
    sections: { headerAlign: "center", ruleStyle: "solid" },
  },
  compact: {
    layout: "one-column", page: { size: "a4", marginX: 16, marginY: 14 },
    fonts: { body: "Roboto", heading: "Hanken Grotesk", bodySize: 8.3, profileSize: 8.6, nameSize: 30, titleSize: 11, sectionSize: 9.5 },
    colors: { ink: "#2b2b2b", muted: "#555555", rule: "#2b2b2b", accent: "#3a3a3a", sidebarRule: "#cfcfcf" },
    spacing: { header: 6, section: 4, role: 3.5, columnGap: 8, sidebarWidth: 55 },
    sections: { headerAlign: "left", ruleStyle: "solid" },
  },
});

const rules = {
  layout: ["one-column", "two-column"],
  page: { size: ["a4", "letter"], marginX: [8, 30], marginY: [8, 30] },
  fonts: { body: ["Roboto", "Hanken Grotesk"], heading: ["Roboto", "Hanken Grotesk"], bodySize: [7, 12], profileSize: [7, 13], nameSize: [18, 38], titleSize: [8, 16], sectionSize: [8, 14] },
  colors: { ink: "color", muted: "color", rule: "color", accent: "color", sidebarRule: "color" },
  spacing: { header: [0, 16], section: [0, 14], role: [0, 12], columnGap: [3, 20], sidebarWidth: [35, 80] },
  sections: { headerAlign: ["left", "center", "right"], ruleStyle: ["solid", "dashed", "none"] },
};

function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }

function validate(input, schema = rules, prefix = "design") {
  if (!object(input)) throw new Error(`${prefix} must be a mapping`);
  for (const [key, value] of Object.entries(input)) {
    const rule = schema[key];
    const setting = `${prefix}.${key}`;
    if (rule === undefined) throw new Error(`Unknown design setting ${setting}`);
    if (object(rule)) { validate(value, rule, setting); continue; }
    if (rule === "color") {
      if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`${setting} must be a six-digit hex color`);
    } else if (typeof rule[0] === "number") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < rule[0] || value > rule[1]) throw new Error(`${setting} must be between ${rule[0]} and ${rule[1]}`);
    } else if (!rule.includes(value)) throw new Error(`${setting} must be one of ${rule.join(", ")}`);
  }
}

function merge(base, patch) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) result[key] = object(value) ? { ...result[key], ...value } : value;
  return result;
}

export function resolveDesign(workspace = {}, variant = {}) {
  for (const [label, config] of [["workspace", workspace], ["variant", variant]]) {
    if (!object(config)) throw new Error(`${label} design must be a mapping`);
    if (config.preset !== undefined && !Object.hasOwn(PRESETS, config.preset)) throw new Error(`${label} design.preset must be one of ${Object.keys(PRESETS).join(", ")}`);
    const { preset, ...settings } = config;
    validate(settings);
  }
  const preset = variant.preset ?? workspace.preset ?? "classic";
  const { preset: _workspacePreset, ...workspaceSettings } = workspace;
  const { preset: _variantPreset, ...variantSettings } = variant;
  return merge(merge(PRESETS[preset], workspaceSettings), variantSettings);
}

export function readDesign(workspaceDir, variantDir) {
  function read(file) {
    if (!fs.existsSync(file)) return {};
    return yaml.load(fs.readFileSync(file, "utf8")) ?? {};
  }
  return resolveDesign(read(path.join(workspaceDir, "data/design.yaml")), read(path.join(variantDir, "design.yaml")));
}

export function pageDimensions(design) {
  return design.page.size === "letter" ? { width: 215.9, height: 279.4 } : { width: 210, height: 297 };
}

export function designCss(design, scale) {
  const { width, height } = pageDimensions(design);
  const vars = {
    "page-width": `${width}mm`, "page-height": `${height}mm`, "margin-x": `${design.page.marginX}mm`, "margin-y": `${design.page.marginY}mm`,
    "body-font": `"${design.fonts.body}"`, "heading-font": `"${design.fonts.heading}"`,
    "body-size": `${design.fonts.bodySize}pt`, "profile-size": `${design.fonts.profileSize}pt`, "name-size": `${design.fonts.nameSize}pt`, "title-size": `${design.fonts.titleSize}pt`, "section-size": `${design.fonts.sectionSize}pt`,
    ink: design.colors.ink, muted: design.colors.muted, rule: design.colors.rule, diamond: design.colors.accent, "sidebar-rule": design.colors.sidebarRule,
    "header-space": `${design.spacing.header}mm`, "section-space": `${design.spacing.section}mm`, "role-space": `${design.spacing.role}mm`, "column-gap": `${design.spacing.columnGap}mm`, "sidebar-width": `${design.spacing.sidebarWidth}mm`,
    "header-align": design.sections.headerAlign, "rule-style": design.sections.ruleStyle, scale,
  };
  return `:root{${Object.entries(vars).map(([key, value]) => `--${key}:${value}`).join(";")}}@page{size:${width}mm ${height}mm;margin:0}`;
}
