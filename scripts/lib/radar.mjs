// Shared job-radar helpers for probe (title scan) and ingest (JD scoring).
// Title pitfalls must stay in sync with the comments in inbox/prefs.yaml.

export const FETCH_CAP = 15;
export const CARD_CAP = 5;

export function classifyTitle(title) {
  const t = String(title || "").toLowerCase();

  if (/\bgovernment\b/.test(t)) return { band: "pitfall", why: "government ≠ governance" };
  if (/unity catalog/.test(t)) return { band: "pitfall", why: "Unity Catalog SWE" };
  if (/engagement manager/.test(t)) return { band: "pitfall", why: "PS engagement manager" };
  if (/people governance/.test(t)) return { band: "pitfall", why: "People/HR governance" };
  if (/\bprivacy\b/.test(t) && /governance/.test(t)) return { band: "pitfall", why: "privacy-attorney track" };
  if (/information security|is controls|\bciso\b/.test(t)) {
    return { band: "pitfall", why: "IS-controls / CISO GRC" };
  }
  if (/\benablement\b/.test(t) && !/\b(analytics|data)\b/.test(t)) {
    return { band: "pitfall", why: "enablement without data/analytics" };
  }
  if (/\bproduct manager\b/.test(t) && /governance/.test(t)) {
    return { band: "pitfall", why: "PM of a governance product" };
  }
  if (/product marketing/.test(t) && /governance/.test(t)) {
    return { band: "pitfall", why: "GTM / product marketing" };
  }
  if (/organisational development|organizational development|org(?:anisational)? development/.test(t)) {
    return { band: "pitfall", why: "org-development / L&D practitioner" };
  }

  if (/data governance/.test(t)) return { band: "core", why: "data governance" };
  if (/\bmetadata lead\b/.test(t)) return { band: "core", why: "metadata lead" };
  if (/data catalog/.test(t)) return { band: "core", why: "data catalog" };
  if (/data discovery/.test(t)) return { band: "core", why: "data discovery" };
  if (/\blineage\b/.test(t)) return { band: "core", why: "lineage" };
  if (/data quality lead/.test(t)) return { band: "core", why: "data quality lead" };
  if (/data stewardship/.test(t)) return { band: "core", why: "data stewardship" };
  if (/data ownership/.test(t)) return { band: "core", why: "data ownership" };

  if (/data platform lead/.test(t)) return { band: "stretch", why: "data platform lead" };
  if (/analytics enablement/.test(t)) return { band: "stretch", why: "analytics enablement" };
  if (/ai enablement/.test(t) && /\b(data|analytics)\b/.test(t)) {
    return { band: "stretch", why: "AI enablement for data/analytics" };
  }
  if (/ai governance/.test(t)) return { band: "stretch", why: "AI governance" };
  if (/data quality/.test(t) && /practitioner|catalog/.test(t)) {
    return { band: "stretch", why: "data quality practitioner" };
  }
  // Collibra's board title is "Global Practioner" (typo) — still the DQ-practitioner stretch.
  if (/\bpracti[ct]ioner\b|\bpractioner\b/.test(t)) {
    return { band: "stretch", why: "catalog practitioner / PS" };
  }

  return null;
}

export function htmlToText(raw) {
  if (!raw) return "";
  let s = String(raw);
  s = s.replace(/&amp;(lt|gt|quot|#39|#x27|nbsp);/gi, "&$1;");
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  s = s.replace(/&#39;|&#x27;|&apos;/g, "'");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return s.replace(/\s+/g, " ").trim();
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
  const names = {
    grafanalabs: "Grafana Labs",
    remotecom: "Remote",
    traderepublicbank: "Trade Republic",
    montecarlodata: "Monte Carlo",
    gocardless: "GoCardless",
    hellofresh: "HelloFresh",
    getyourguide: "GetYourGuide",
    gropyus: "GROPYUS",
  };
  if (names[token]) return names[token];
  return String(token || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function jobText(source, job) {
  const html = job.content || job.descriptionHtml || "";
  const plain = job.descriptionPlain || "";
  const depts = (job.departments || [])
    .map((d) => (typeof d === "string" ? d : d.name))
    .concat(job.department ? [job.department] : [])
    .filter(Boolean)
    .join(" ");
  return `${htmlToText(html)} ${plain} ${depts}`.replace(/\s+/g, " ").trim();
}

function blob(location, text) {
  return `${location || ""} ${text || ""}`.toLowerCase();
}

export function scoreGeo(location, text) {
  const b = blob(location, text);
  const loc = String(location || "").toLowerCase();

  const hybridDays =
    /hybrid/.test(b) && /(?:at least )?(?:two|2|three|3) days(?: each| per)? week/.test(b);
  const cyprus = /cyprus|paphos/.test(b);
  if (hybridDays && !cyprus) {
    return { geo: "reject", why: "hybrid ≥2 days/week outside Cyprus" };
  }

  const remote =
    /\bremote\b/.test(b) || /\bdistributed\b/.test(b) || /\bhome[- ]based\b/.test(b);
  const europe =
    /\b(europe|eu\b|emea|uk\b|united kingdom|cyprus|eet|eest|ireland|germany|netherlands|spain|portugal|france|austria|belgium|finland|sweden|denmark|poland)\b/.test(
      b,
    );
  const usLoc = /\b(usa|u\.s\.a\.|united states|us-only|remote, usa)\b/.test(loc);
  const noSponsor =
    /not eligible for visa sponsorship|visa not sponsored|cannot sponsor|unable to sponsor|no visa sponsorship/.test(
      b,
    );

  if (/must relocate|relocation required/.test(b) && !remote) {
    return { geo: "reject", why: "relocation required" };
  }

  if (usLoc && !europe && /onsite|on-site|in-office/.test(b) && !remote) {
    return { geo: "reject", why: "US-only onsite" };
  }
  if (usLoc && !europe && noSponsor) {
    return { geo: "later", why: "US remote + no visa sponsorship" };
  }
  if (usLoc && !europe && !remote) {
    return { geo: "reject", why: "US-only onsite" };
  }

  if (remote || europe) return { geo: "ok", why: "EU/UK/remote/EET-friendly" };

  const city = /berlin|brussels|london|munich|paris|amsterdam|barcelona|lisbon|warsaw/.test(loc);
  if (city && !remote) return { geo: "later", why: "city listing, remote not stated" };

  return { geo: "later", why: "geo unclear" };
}

export function skipListHits(title, text) {
  const t = `${title || ""} ${text || ""}`.toLowerCase();
  const hits = [];
  if (/\bcdo\b|chief data officer/.test(t)) hits.push("CDO");
  if (/\bvp data\b|vice president of data\b/.test(t)) hits.push("VP Data");
  if (/\bhead of data\b/.test(t) && !/head of data governance/.test(t)) hits.push("Head of Data");
  if (/staff data engineer/.test(t)) hits.push("Staff Data Engineer");
  if (/\bspark\b/.test(t) && /\b(ic|individual contributor)\b/.test(t)) hits.push("Spark IC");
  if (/technical ai engagement/.test(t)) hits.push("Technical AI Engagement");
  if (/agentic coding/.test(t)) hits.push("agentic coding");
  if (/llm gateway/.test(t)) hits.push("LLM gateway");
  if (/\bbedrock\b/.test(t) && /required|must have|daily/.test(t)) hits.push("Bedrock as the job");
  if (
    /privacy attorney|licensed to practice law|team of attorneys|legal privacy program|seasoned privacy/.test(
      t,
    )
  ) {
    hits.push("privacy attorney / legal privacy program");
  }
  if (
    /information security controls|is controls|ciso office|\bciso\b|information risk management/.test(
      t,
    )
  ) {
    hits.push("information-security controls / CISO-office GRC");
  }
  if (
    /talent management/.test(t) &&
    /enablement/.test(t) &&
    !/\b(analytics|data) enablement\b/.test(t)
  ) {
    hits.push("L&D / talent enablement");
  }
  if (
    /(sales enablement|customer enablement|go-to-market|product marketing)/.test(t) &&
    !/\b(data|analytics) enablement\b/.test(t)
  ) {
    hits.push("sales / GTM / customer enablement");
  }
  if (/\bproduct manager\b/.test(t) && /governance/.test(t)) {
    hits.push("product manager of a governance product");
  }
  if (
    /professional services/.test(t) &&
    /engagement manager|installation|configuration/.test(t)
  ) {
    hits.push("catalog-vendor professional services");
  }
  return hits;
}

function vendorChampion(text) {
  const t = String(text || "").toLowerCase();
  return /key champion|product champion|champion or stakeholder of \w+|years of direct.{0,80}collibra/.test(
    t,
  );
}

function termHits(text, terms) {
  const t = String(text || "").toLowerCase();
  return (terms || [])
    .map(String)
    .map((term) => term.replace(/\s*\(.*\)$/, "").trim())
    .filter((term) => term.length >= 3 && term.length <= 40)
    .filter((term) => t.includes(term.toLowerCase()));
}

export function scoreHonesty(title, text, titleBand) {
  const tl = String(title || "").toLowerCase();
  const t = `${tl} ${text || ""}`.toLowerCase();

  if (/\bdirector\b|\bvp\b|vice president|head of /.test(tl)) {
    return {
      matchTitle: false,
      headline: "n/a",
      why: "seniority above evidenced 3-person DG team lead",
      needsHuman: true,
    };
  }

  const engineer = /\bengineer\b/.test(tl);
  if (engineer) {
    return {
      matchTitle: false,
      headline: "Data Governance Team Lead",
      why: "IC-engineer scope, not a 3-person DG team lead",
      needsHuman: true,
    };
  }

  if (titleBand === "stretch" && /practi[ct]ioner|practioner|data quality/.test(t)) {
    return {
      matchTitle: false,
      headline: 'Data Quality Program Lead — not the posting\'s vendor "Practitioner" title, and not a promotion to Director',
      why: "core DQ work under a vendor practitioner title",
      needsHuman: false,
    };
  }

  if (titleBand === "core") {
    const headline = String(title || "").length <= 42 ? title : "Data Governance Team Lead";
    return {
      matchTitle: true,
      headline,
      why: "core title, scope looks in-band",
      needsHuman: false,
    };
  }

  return {
    matchTitle: false,
    headline: "Data Governance Team Lead",
    why: "nearest honest label",
    needsHuman: false,
  };
}

function displayTitle(title, text) {
  let out = String(title || "");
  if (/\bpractioner\b/i.test(out)) out = out.replace(/practioner/gi, "Practitioner");
  if (/\bpractitioner\b/i.test(out) && /data quality/i.test(text) && !/data quality/i.test(out)) {
    out = `${out} (Data Quality)`;
  }
  return out;
}

function whyFit(job, scored) {
  if (scored.skipHits.length) {
    return `none we can claim; JD maps to ${scored.skipHits[0]}`;
  }
  const t = `${job.title} ${job.text}`.toLowerCase();
  const bits = [];
  if (/data quality/.test(t)) bits.push("data quality operating model / stewardship");
  if (/lineage|metadata|catalog/.test(t)) bits.push("metadata / catalog / lineage");
  if (/data ownership/.test(t) && !bits.some((b) => /ownership|steward/.test(b))) {
    bits.push("data ownership");
  }
  if (/data governance/.test(t) && !bits.length) bits.push("in-house data governance");
  if (bits.length) return bits.join("; ");
  return "title matched core/stretch; read the JD before Prep";
}

function gapsLine(scored) {
  const parts = [];
  if (scored.geo !== "ok") parts.push(scored.geoWhy);
  if (scored.skipHits.length) parts.push(scored.skipHits.join("; "));
  if (scored.champion) parts.push("vendor product-champion as a hard requirement");
  if (scored.honesty.needsHuman) parts.push(scored.honesty.why);
  if (!parts.length && scored.penalties.length) parts.push(scored.penalties.slice(0, 3).join("; "));
  return parts.join("; ") || "none recorded";
}

function bandLine(scored) {
  if (scored.decision === "Skip" && scored.titleBand === "core") {
    return "skip (title looks core; JD is not)";
  }
  if (scored.decision === "Skip" && scored.titleBand === "stretch") {
    return "skip (stretch title, wrong function)";
  }
  if (scored.decision === "Skip") return "skip";
  if (
    scored.titleBand === "stretch" &&
    (scored.geo !== "ok" || scored.champion)
  ) {
    return "stretch (core *work*, bad geo/product-lock)";
  }
  return scored.titleBand;
}

function decisionNote(scored) {
  if (scored.decision === "Prep") return "";
  if (scored.decision === "Later") {
    if (scored.geo === "later" && scored.champion) {
      return "revisit only if they open EU remote or drop the vendor-champion requirement";
    }
    if (scored.honesty.needsHuman) return "do not Prep without a human read";
    if (scored.geo !== "ok") return "revisit if geo becomes Cyprus-compatible";
    return "needs a human read before Prep";
  }
  return "";
}

export function scoreJob(job, prefs = {}) {
  const titleCls = classifyTitle(job.title);
  const titleBand = titleCls?.band || "none";
  const geo = scoreGeo(job.location, job.text);
  const skips = skipListHits(job.title, job.text);
  const honesty = scoreHonesty(job.title, job.text, titleBand === "none" ? null : titleBand);
  const champion = vendorChampion(job.text);
  const boosts = termHits(`${job.title} ${job.text}`, prefs.boost_terms);
  const penalties = termHits(`${job.title} ${job.text}`, prefs.penalty_terms);

  const dqWork = /data quality|data catalog|data governance|data stewardship|data ownership|metadata|lineage/.test(
    `${job.title || ""} ${job.text || ""}`.toLowerCase(),
  );
  const practitionerTitle = /\bpracti[ct]ioner\b|\bpractioner\b/.test(String(job.title || "").toLowerCase());

  let decision = "Skip";
  if (titleBand === "pitfall" || titleBand === "none") {
    decision = "Skip";
  } else if (skips.length) {
    decision = "Skip";
  } else if (practitionerTitle && !dqWork) {
    decision = "Skip";
    skips.push("practitioner without catalog/DQ work");
  } else if (geo.geo === "reject") {
    decision = "Skip";
  } else {
    // Stretch always waits for a human Yes (Neurons Lab lesson). Prep is core-only.
    const prepOk =
      titleBand === "core" &&
      geo.geo === "ok" &&
      !honesty.needsHuman &&
      honesty.headline !== "n/a" &&
      !champion;
    decision = prepOk ? "Prep" : "Later";
  }

  const scored = {
    titleBand: titleBand === "pitfall" ? "skip" : titleBand,
    titleWhy: titleCls?.why || "",
    geo: geo.geo,
    geoWhy: geo.why,
    skipHits: skips,
    champion,
    boosts,
    penalties,
    honesty,
    decision,
  };
  scored.decisionNote = decisionNote(scored);
  scored.bandNote = bandLine(scored);
  scored.honestHeadline =
    decision === "Skip" && (skips.length || titleBand === "pitfall")
      ? `n/a — ${skips[0] || titleCls?.why || honesty.why}`
      : honesty.headline;
  scored.whyFit = whyFit(job, scored);
  scored.gaps = gapsLine(scored);
  scored.displayTitle = displayTitle(job.title, job.text);
  scored.locationNote =
    geo.why === "US remote + no visa sponsorship"
      ? `${job.location} (no visa sponsorship)`
      : geo.geo === "reject" && /hybrid/.test(geo.why)
        ? `${job.location} (hybrid ≥2 days/week)`
        : job.location;
  return scored;
}

export function rankForFetch(jobs) {
  return [...jobs].sort((a, b) => {
    const band = { core: 0, stretch: 1 };
    const d = (band[a.titleBand] ?? 9) - (band[b.titleBand] ?? 9);
    if (d) return d;
    const locScore = (loc) => {
      const l = String(loc || "").toLowerCase();
      if (/cyprus|eet|emea|europe|remote/.test(l)) return 0;
      if (/uk|united kingdom/.test(l)) return 1;
      if (/usa|united states/.test(l)) return 3;
      return 2;
    };
    return locScore(a.location) - locScore(b.location);
  });
}

export function selectShortlist(cards, cap = CARD_CAP) {
  const rank = { Prep: 0, Later: 1, Skip: 2 };
  return [...cards]
    .sort((a, b) => {
      const d = rank[a.decision] - rank[b.decision];
      if (d) return d;
      const band = { core: 0, stretch: 1, skip: 2, none: 3 };
      return (band[a.titleBand] ?? 9) - (band[b.titleBand] ?? 9);
    })
    .slice(0, cap);
}

export function renderShortlist(cards, meta) {
  const date = meta.date;
  const prep = cards.filter((c) => c.decision === "Prep");
  const later = cards.filter((c) => c.decision === "Later");
  const lines = [
    `# Shortlist — ${date}`,
    "",
    `Scored by \`scripts/ingest.mjs\` against \`inbox/prefs.yaml\`. Title pitfalls vetoed before JD fetch; content fetched for ≤${FETCH_CAP} survivors.`,
    "",
  ];
  if (prep.length === 0) {
    const extra = later.length
      ? ` ${later.map((c) => `${c.company} — ${c.displayTitle}`).join("; ")} stayed Later.`
      : "";
    lines.push(`**Prep tonight: none.**${extra} Empty Prep is a valid result.`);
  } else {
    lines.push(`**Prep tonight: ${prep.length}.**`);
  }
  lines.push("");
  if (cards.length === 0) {
    lines.push("No cards passed the title prefilter.");
    lines.push("");
    return lines.join("\n");
  }
  for (const c of cards) {
    const note = c.decisionNote ? ` — ${c.decisionNote}` : "";
    lines.push("---");
    lines.push("");
    lines.push(`## ${c.company} — ${c.displayTitle}`);
    lines.push("");
    lines.push(`- URL: ${c.url}`);
    lines.push(`- Location: ${c.locationNote}`);
    lines.push(`- Band: ${c.bandNote}`);
    lines.push(`- Honest headline: ${c.honestHeadline}`);
    lines.push(`- Why-fit: ${c.whyFit}`);
    lines.push(`- Gaps: ${c.gaps}`);
    lines.push(`- Decision: **${c.decision}**${note}`);
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

export const REPLAY_EXPECTED = {
  8121031: "Later", // Collibra Global Practitioner (Data Quality)
  8138064: "Skip", // Elastic privacy attorney
  7992395: "Skip", // N26 IS-controls
  8109533: "Skip", // Collibra AI Enablement
  8095291: "Skip", // Collibra Engagement Manager
};
