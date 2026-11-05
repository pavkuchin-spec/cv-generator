export function mergeExpertise(baseExpertise, override, { skipReview = false } = {}) {
  if (!override) return baseExpertise;
  if (typeof override !== "object" || Array.isArray(override)) {
    throw new Error("onepager.yaml expertise must be a mapping of groups to lists");
  }
  const merged = {};
  for (const [group, items] of Object.entries(override)) {
    const baseItems = baseExpertise[group];
    if (!skipReview && !baseItems) {
      throw new Error(`onepager.yaml expertise override references unknown group: "${group}"`);
    }
    if (!Array.isArray(items) || items.length === 0 || items.some((item) => typeof item !== "string")) {
      throw new Error(`onepager.yaml expertise override for "${group}" must be a non-empty list of strings`);
    }
    if (!skipReview) {
      for (const item of items) {
        if (!baseItems.includes(item)) {
          throw new Error(
            `onepager.yaml expertise override invents an item not in profile.yaml under "${group}": "${item}"\n` +
            `  allowed: ${baseItems.map((value) => `"${value}"`).join(", ")}`
          );
        }
      }
    }
    merged[group] = items;
  }
  return merged;
}

export function selectCertifications(base, selection, { skipReview = false } = {}) {
  if (selection === undefined) return base;
  if (!Array.isArray(selection) || selection.some((item) => typeof item !== "string")) {
    throw new Error("onepager.yaml certifications must be a list of strings");
  }
  if (!skipReview && selection.some((item) => !base.includes(item))) {
    throw new Error("onepager.yaml certifications must be a subset of profile.yaml certifications");
  }
  return selection;
}
