// Generic, configuration-driven helpers shared by probe and ingest.

function normalized(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function termEntries(values) {
  return (values || []).map((entry) => {
    if (typeof entry === "string") return { term: entry, label: entry };
    return { term: entry.term || "", label: entry.label || entry.term || "" };
  }).filter(({ term }) => term);
}

function firstHit(text, values) {
  const haystack = normalized(text);
  return termEntries(values).find(({ term }) => haystack.includes(normalized(term))) || null;
}

export function classifyTitle(title, prefs = {}) {
  const rules = prefs.titles || {};
  const rejected = firstHit(title, rules.reject);
  if (rejected) return { band: "reject", why: rejected.label };
  const core = firstHit(title, rules.core);
  if (core) return { band: "core", why: core.label };
  const stretch = firstHit(title, rules.stretch);
  if (stretch) return { band: "stretch", why: stretch.label };
  return null;
}

export function htmlToText(raw) {
  if (!raw) return "";
  return String(raw)
    .replace(/&amp;(lt|gt|quot|#39|#x27|nbsp);/gi, "&$1;")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

export function jobLocation(source, job) {
  if (source === "greenhouse") return job.location?.name || "";
  if (typeof job.location === "string") return job.location;
  return job.location?.locationName || job.location?.name || "";
}

export function jobUrl(job) {
  return job.absolute_url || job.jobUrl || job.applyUrl || "";
}

export function jobId(job) {
  return job.id ?? job.jobId ?? "";
}

export function jobCompany(job, token) {
  if (job.company_name) return job.company_name;
  if (job.companyName) return job.companyName;
  return String(token || "").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function jobText(_source, job) {
  const departments = (job.departments || [])
    .map((department) => typeof department === "string" ? department : department.name)
    .concat(job.department ? [job.department] : [])
    .filter(Boolean).join(" ");
  return `${htmlToText(job.content || job.descriptionHtml || "")} ${job.descriptionPlain || ""} ${departments}`
    .replace(/\s+/g, " ").trim();
}

export function scoreGeo(location, text, prefs = {}) {
  const rules = prefs.geo || {};
  const combined = normalized(`${location || ""} ${text || ""}`);
  const rejected = firstHit(combined, rules.reject_terms);
  if (rejected) return { geo: "reject", why: rejected.label };

  const hybrid = /\bhybrid\b/.test(combined) && /\b(?:two|2|three|3|four|4|five|5) days?\b/.test(combined);
  const atHome = Boolean(firstHit(combined, rules.home_terms));
  if (hybrid && !atHome && rules.hybrid_outside_home === "reject") {
    return { geo: "reject", why: "hybrid schedule outside configured home location" };
  }

  const accepted = firstHit(combined, rules.accept_terms);
  if (accepted) return { geo: "ok", why: `matches accepted geography: ${accepted.label}` };
  return { geo: "later", why: "geography is not clearly accepted or rejected" };
}

function hits(text, values) {
  const haystack = normalized(text);
  return termEntries(values).filter(({ term }) => haystack.includes(normalized(term))).map(({ label }) => label);
}

function scoreHonesty(title, titleBand, prefs) {
  const headline = prefs.headline || {};
  const review = firstHit(title, headline.review_terms);
  if (review) {
    return { headline: headline.default || "Candidate", needsHuman: true, why: `title contains review term: ${review.label}` };
  }
  if (titleBand === "core" && String(title).length <= (headline.max_chars || 42)) {
    return { headline: title, needsHuman: false, why: "configured core title" };
  }
  return { headline: headline.default || "Candidate", needsHuman: titleBand !== "core", why: "using configured default headline" };
}

export function scoreJob(job, prefs = {}) {
  const classification = classifyTitle(job.title, prefs);
  const titleBand = classification?.band || "none";
  const geo = scoreGeo(job.location, job.text, prefs);
  const combined = `${job.title || ""} ${job.text || ""}`;
  const boosts = hits(combined, prefs.boost_terms);
  const penalties = hits(combined, prefs.penalty_terms);
  const honesty = scoreHonesty(job.title, titleBand, prefs);

  let decision = "Skip";
  if (titleBand === "core" && geo.geo === "ok" && !honesty.needsHuman) decision = "Prep";
  else if ((titleBand === "core" || titleBand === "stretch") && geo.geo !== "reject") decision = "Later";

  const gaps = [];
  if (geo.geo !== "ok") gaps.push(geo.why);
  if (penalties.length) gaps.push(...penalties.slice(0, 3));
  if (honesty.needsHuman) gaps.push(honesty.why);

  return {
    titleBand: titleBand === "reject" ? "skip" : titleBand,
    titleWhy: classification?.why || "no configured title match",
    geo: geo.geo,
    geoWhy: geo.why,
    skipHits: titleBand === "reject" ? [classification.why] : [],
    boosts,
    penalties,
    honesty,
    decision,
    decisionNote: decision === "Later" ? "requires a human review before tailoring" : "",
    bandNote: titleBand === "reject" ? "skip" : titleBand,
    honestHeadline: decision === "Skip" ? "n/a" : honesty.headline,
    whyFit: boosts.length ? boosts.join("; ") : classification?.why || "no configured match",
    gaps: gaps.join("; ") || "none recorded",
    displayTitle: String(job.title || ""),
    locationNote: job.location || "not stated",
  };
}

export function rankForFetch(jobs, prefs = {}) {
  const accepted = termEntries(prefs.geo?.accept_terms).map(({ term }) => normalized(term));
  return [...jobs].sort((a, b) => {
    const band = { core: 0, stretch: 1 };
    const byBand = (band[a.titleBand] ?? 9) - (band[b.titleBand] ?? 9);
    if (byBand) return byBand;
    const locationRank = (value) => accepted.some((term) => normalized(value).includes(term)) ? 0 : 1;
    return locationRank(a.location) - locationRank(b.location);
  });
}

export function selectShortlist(cards, cap = 5) {
  const rank = { Prep: 0, Later: 1, Skip: 2 };
  return [...cards].sort((a, b) => rank[a.decision] - rank[b.decision]).slice(0, cap);
}

export function renderShortlist(cards, meta = {}) {
  const lines = [
    `# Shortlist - ${meta.date || "undated"}`,
    "",
    "Scored from the active workspace preferences. Every Prep decision still requires human review before applying.",
    "",
    `**Prep: ${cards.filter((card) => card.decision === "Prep").length}.**`,
    "",
  ];
  if (!cards.length) lines.push("No cards passed the configured title prefilter.", "");
  for (const card of cards) {
    lines.push(
      "---", "", `## ${card.company} - ${card.displayTitle}`, "",
      `- URL: ${card.url}`, `- Location: ${card.locationNote}`, `- Band: ${card.bandNote}`,
      `- Honest headline: ${card.honestHeadline}`, `- Why-fit: ${card.whyFit}`,
      `- Gaps: ${card.gaps}`, `- Decision: **${card.decision}**${card.decisionNote ? ` - ${card.decisionNote}` : ""}`, "",
    );
  }
  return lines.join("\n");
}
