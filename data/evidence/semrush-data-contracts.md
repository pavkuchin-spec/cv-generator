# Cross-team data agreement for revenue-critical CRM data (Semrush)

## Problem
Revenue reporting (MRR, sales attribution, sales compensation) depends on CRM (Salesforce) fields owned by a business-facing go-to-market team, outside Analytics' control. Multiple incidents had already reached production reporting because upstream schema, formula, or automation changes weren't communicated in advance: a wrong payment identifier propagated into MRR and compensation reporting; thousands of records lost their linking ID and broke a daily revenue report; a bulk update silently rewrote thousands of historical records. There was no formal agreement defining who needed to be told what, or how incidents would be handled jointly.

## What I did
- Proposed and drove a lightweight, two-track data agreement between Analytics, the data integration team, and the CRM-owning business team, scoped to a defined set of business-critical CRM fields feeding revenue reporting.
- Designed the two tracks: a prevention track (advance notice before planned changes to in-scope fields) and an incident-collaboration track (joint triage when something breaks), reusing an existing change-notification process as the mechanism for the prevention track.
- Built the evidence base justifying the agreement: catalogued nine real incidents where unannounced upstream changes had broken revenue reporting or metrics, and used that pattern to make the case rather than a hypothetical risk.
- Iterated the proposal directly against stakeholder feedback — cut it from a heavy formal governance framework down to a 1-2 page operational document after early reviewers pushed back on weight and formality, while keeping incident collaboration as first-class as prevention.
- Defined a minimum-viable adoption path (kick off incident collaboration first if the counterpart team couldn't commit to the prevention track immediately) to avoid an all-or-nothing negotiation.

## Scale & outcome
- Produced a stakeholder-ready proposal covering a defined critical-field registry, adopted as the template for how Analytics negotiates data reliability with upstream business-system owners.
- Established data integration as the first point of contact for schema/extraction/ingestion questions and Analytics as the owner of business-impact validation — clarifying a previously undefined boundary.

## Result lenses
- **Scale** — a defined critical-field registry covering the business-critical CRM fields that feed MRR, sales attribution, and sales compensation reporting; an evidence base of nine catalogued real incidents; an agreement spanning three teams.
- **Help** — the data integration team and Analytics, whose boundary was previously undefined and is now explicit (data integration as first point of contact for schema, extraction, and ingestion questions; Analytics as owner of business-impact validation); the CRM-owning business team, which got a 1-2 page operational document rather than a heavy governance framework to sign up to.
- **Problems** — unannounced upstream changes reaching production revenue reporting: a wrong payment identifier propagating into MRR and compensation reporting, thousands of records losing their linking ID and breaking a daily revenue report, a bulk update silently rewriting thousands of historical records. The agreement's prevention track (advance notice on planned changes) and incident-collaboration track (joint triage) address both halves.
- **Leadership** — proposed and drove the agreement across three teams, built the incident evidence base that made the case, iterated the proposal down in weight against direct stakeholder pushback while keeping incident collaboration first-class, and defined a minimum-viable adoption path to avoid an all-or-nothing negotiation.

## Technologies
Salesforce/CRM data model, BigQuery, stakeholder proposal writing, incident-pattern analysis.

Source: `PROJECTS/Data Contracts/SFDC Data Agreement Work Summary.md` (vault, sanitized — ticket IDs and specific field/system names removed, team named generically)
