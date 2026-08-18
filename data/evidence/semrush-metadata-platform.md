# Enterprise metadata & lineage platform (Semrush)

## Problem
The company's Analytics Division relied on a manually maintained Confluence page as its data catalog: no lineage, weak search, no reliable way to see who used a table or who to notify before changing it. Teams outside Analytics had limited or no access. This cost teams an estimated 2-5 hours per week in manual data discovery, and slowed incident resolution and safe deprecation of old tables.

## What I did
- Owned and drove a multi-workstream program (roughly one FTE) to replace the manual catalog with an enterprise metadata and lineage platform, coordinating with data engineering and platform teams.
- Led migration of all catalog content (descriptions, business glossary) from Confluence into the new platform, opened access to teams outside Analytics with role-based permissions, and published a self-service onboarding guide.
- Designed and built Python automation to keep catalog content synced and reduce manual upkeep.
- Delivered a set of targeted use cases: ownership propagation and an ownership KPI, usage analytics per table ("who uses this?"), and in-IDE pre-change impact analysis (lineage-based "what breaks if I change this?" queries).
- Extended the platform's coverage to a new unified data platform initiative as it launched, establishing end-to-end lineage for the company's core revenue-reporting domain from source systems through transformation to BI.
- Wired the metadata platform into the company's internal AI data assistant and coding assistants (via MCP), making it a structured backend that AI tools query directly instead of relying on hardcoded text.

## Scale & outcome
- Catalog covers 50,000+ tables across the company's data warehouse.
- 100+ registered catalog users across 18 teams; adoption grew double digits month over month during rollout.
- The internal AI data assistant now answers roughly one in seven of its data questions by querying the catalog directly, rather than from static hardcoded definitions.
- Retired the legacy manually maintained catalog on schedule; the metadata platform is now a shared capability used by both humans and AI tooling.

## Result lenses
- **Scale** — 50,000+ tables cataloged; 100+ registered users across 18 teams; adoption growing double digits month over month during rollout; a multi-workstream program of roughly one FTE.
- **Help** — teams that had been losing an estimated 2-5 hours per week to manual data discovery; teams outside Analytics, who previously had limited or no catalog access, onboarded via role-based permissions and a self-service guide; engineers who can now ask "what breaks if I change this?" in-IDE before shipping; the internal AI data assistant and coding assistants, which query the platform directly via MCP instead of relying on hardcoded text.
- **Problems** — no lineage, weak search, and no way to see who used a table or who to notify before changing it; slow incident resolution and unsafe deprecation of old tables. The legacy manually maintained catalog was retired on schedule, and the AI assistant now answers roughly one in seven data questions from the governed catalog rather than static hardcoded definitions.
- **Leadership** — owned and drove the program end to end, coordinating data engineering and platform teams, and extended coverage to a new unified data platform initiative to establish end-to-end lineage for the company's core revenue-reporting domain.

## Technologies
Python, metadata/lineage platform administration, BigQuery, dbt, MCP (AI tool integration), Kubernetes-based deployment operations.

Source: vault notes under `PROJECTS/OpenMetadata/` (vault, sanitized — internal program/platform codename generalized to "enterprise metadata & lineage platform", precise counts rounded)
