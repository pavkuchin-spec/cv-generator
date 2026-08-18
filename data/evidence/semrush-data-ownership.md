# Data ownership framework (Semrush)

## Problem
The analytics data warehouse had grown under a legacy dual "Business Owner / Technical Owner" model that was inconsistent and hard to enforce: of ~1,700+ owned tables, ownership sat with the wrong group or was ambiguous in a large share of cases, and thousands more tables had no owner recorded at all. Ownership wasn't enforced anywhere in the delivery pipeline, so it decayed constantly.

## What I did
- Designed and led the phased migration from the legacy two-role ownership model to a single, enforced "Data Owner" standard across all transformation-layer (dbt) assets.
- Defined the new ownership contract (minimum two team-level owner aliases, no individual-person ownership, to keep it maintainable through reorgs and turnover) and mapped every existing table into it based on defined rules.
- Enforced the standard end-to-end: CI validation that fails builds on missing/invalid ownership, automatic code-review routing generated from the ownership field, ownership propagated into the workflow scheduler's task metadata, and Slack alerting/notifications routed to the correct owner.
- Designed the ownership lifecycle: automatic notification on assignment, periodic re-validation to prevent staleness, and mandatory reassignment triggers on offboarding or team reorganization.
- Extended the same standard beyond the transformation layer to non-dbt assets (scripts, ML models, and other pipeline-produced tables), assigning the right mix of data owner, data engineer, and subject-matter-expert accountability per asset type.
- Scaled the resulting framework across a team of 50+ analysts as the operating standard for how ownership is assigned, reviewed, and maintained.

## Scale & outcome
- Standard applied across 1,700+ warehouse tables in the initial migration, then extended platform-wide.
- Ownership enforcement built into CI/CD, code review, workflow scheduling, and alerting — not a documentation-only policy.
- Became the operating model referenced when designing ownership for the company's next-generation unified data platform.

## Technologies
dbt, Python, GitLab CI, Apache Airflow, Slack API, BigQuery.

Source: `PROJECTS/Data Ownership/"Data Ownership" Project Plan.md`, `PROJECTS/Data Ownership/Ownership Framework Implementation.md` (vault, sanitized — precise counts rounded, no internal ticket/repo references)
