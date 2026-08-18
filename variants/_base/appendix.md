# Semrush — Data Governance Team Lead (July 2024 - Present)

## Enterprise metadata & lineage platform

**Problem.** Analytics relied on a manually maintained Confluence page as its data catalog — no lineage, weak search, no way to see who used a table or who to notify before changing it. This cost teams an estimated 2-5 hours per week in manual data discovery.

**What I did.** Owned and drove a multi-workstream program (~1 FTE) to replace it with an enterprise metadata and lineage platform. Led migration of all catalog content from Confluence, opened access to teams outside Analytics with role-based permissions, and published a self-service onboarding guide. Built Python automation to keep catalog content synced. Delivered targeted use cases: ownership propagation and KPIs, per-table usage analytics, and in-IDE pre-change impact analysis. Extended coverage to a new unified data platform initiative, establishing end-to-end lineage for the company's core revenue-reporting domain. Wired the platform into the company's internal AI data assistant and coding assistants via MCP.

**Scale & outcome.** 50,000+ tables cataloged; 100+ users across 18 teams; the internal AI assistant now answers roughly one in seven of its data questions directly from the catalog. Retired the legacy manual catalog on schedule.

*Technologies: Python, metadata/lineage platform administration, BigQuery, dbt, MCP, Kubernetes.*

---

## Data ownership framework

**Problem.** The warehouse operated under a legacy dual "Business Owner / Technical Owner" model — inconsistent, unenforced, with thousands of tables lacking any recorded owner.

**What I did.** Designed and led the phased migration to a single, enforced "Data Owner" standard across all transformation-layer assets. Defined the ownership contract (minimum two team-level aliases, never individuals, to survive reorgs and turnover) and enforced it end-to-end: CI validation, automatic review routing, propagation into the workflow scheduler, and Slack alerting. Designed the ownership lifecycle — assignment notifications, periodic re-validation, mandatory reassignment on offboarding or reorg. Extended the standard beyond the transformation layer to non-dbt assets, and scaled the resulting framework across a team of 50+ analysts.

**Scale & outcome.** Applied across 1,700+ warehouse tables in the initial migration, then extended platform-wide. Became the reference model for ownership design on the company's next-generation unified data platform.

*Technologies: dbt, Python, GitLab CI, Apache Airflow, Slack API, BigQuery.*

---

## AI knowledge management for the internal AI data assistant

**Problem.** The company's internal AI data assistant answered from knowledge hardcoded in its own skill definitions — disconnected from the metric and table definitions actually governed elsewhere, not authored for AI consumption, with no feedback loop to catch wrong answers.

**What I did.** Co-designed and helped launch a 6-month MVP program to make the assistant's knowledge manageable, certified, and measurable, scoped to its ten highest-impact questions. Designed a two-store "AI Knowledge Base": a structured catalog half paired with a version-controlled Git repository for narrative definitions and caveats, reviewed via merge request. Defined a "Certified for AI" content standard and a knowledge-classification scheme driving a per-answer confidence signal. Owned the capability of accumulating and storing certified knowledge on behalf of Data Governance, and coordinated the initiative across the participating teams.

**Scale & outcome.** Proved the model on a 10-question pilot scope, shifting the assistant's knowledge model from hardcoded, drifting text to a governed source read live at answer time.

*Technologies: Git-based knowledge repos (MR/review workflow), metadata/catalog platform, MCP-based AI tool integration.*

---

## Cross-team data agreement for revenue-critical CRM data

**Problem.** Revenue reporting depends on CRM fields owned by a business-facing go-to-market team outside Analytics' control. Multiple incidents had already reached production reporting from unannounced upstream changes — a wrong payment identifier propagating into MRR and compensation reporting, thousands of records losing their linking ID and breaking a daily revenue report, a bulk update silently rewriting historical records.

**What I did.** Proposed and drove a lightweight, two-track data agreement between Analytics, the data integration team, and the CRM-owning business team, scoped to a defined set of business-critical fields. Designed a prevention track (advance notice on planned changes) and an incident-collaboration track (joint triage). Built the evidence base by cataloguing nine real incidents. Iterated the proposal against direct stakeholder feedback, cutting it from a heavy governance framework to a 1-2 page operational document.

**Scale & outcome.** Produced a stakeholder-ready proposal now used as the template for negotiating data reliability with upstream business-system owners; clarified the ownership boundary between data integration and Analytics.

*Technologies: Salesforce/CRM data model, BigQuery, stakeholder proposal writing, incident-pattern analysis.*

---

## Data Governance strategy & team leadership

**Problem.** Data Governance was perceived as a policy/compliance function rather than a builder of things people used — a perception with a real cause: an audit of the team's own intake found the majority of "incoming requests" were self-generated, not asks from other teams.

**What I did.** Developed a comprehensive two-year Data Governance strategy for the Analytics Division, approved by VP-level leadership. Manage day-to-day operations of a 3-person team. Repositioned how the function reports value — replaced qualitative claims with monthly-tracked, honestly-scoped metrics (share of self-generated vs. externally-driven work, platform reliability, migration progress against a measured baseline). Diagnosed the underlying perception problem using the team's own ticket history and used it as the deliberate opening of the repositioning story.

**Scale & outcome.** Strategy approved by VP; shifted the team's narrative from governance enforcement to hands-on technical enablement for a 50+ person analytics organization; introduced the team's first monthly leadership-facing metrics reporting.

*Technologies: Stakeholder communication and strategy writing, ticket/work data analysis, cross-functional program management.*

---

# Sibedge (Legato Data Platform) — System Analyst (Aug 2023 - July 2024)

**Problem.** An enterprise data platform needed consistent permission management across multiple independent data services, with a reliable audit trail.

**What I did.** Designed an RBAC system spanning 7 data services with a complete audit trail. Designed an event-driven architecture using Kafka to propagate permission changes consistently across the entire data ecosystem.

*Technologies: RBAC design, Apache Kafka, event-driven architecture.*

---

# DECO Systems — Lead Analyst (July 2022 - Aug 2023)

**Problem.** The client needed a corporate data warehouse integrated with BI reporting, delivered by a cross-functional team under a fixed budget and timeline.

**What I did.** Led a cross-functional team of 6 analysts and engineers as analytics team lead, establishing development standards and best practices. Implemented the Data Vault 2.0 methodology across 100+ tables spanning 6 source systems.

**Scale & outcome.** Delivered the corporate data warehouse on time and within budget.

*Technologies: Data Vault 2.0, data warehouse architecture, BI reporting integration.*

---

# TechAudit — Business Intelligence Analyst (Aug 2019 - June 2022)

**Problem.** Major retail and B2B clients needed end-to-end analytical solutions turning business challenges into actionable, automated insight.

**What I did.** Developed inventory management dashboards for a major retail client (VkusVill), applying predictive analytics. Implemented SARIMAX time-series models for demand forecasting. Delivered 30+ operational dashboards backed by automated data pipelines.

**Scale & outcome.** Reduced VkusVill's operational costs by 12%; sub-10%-error demand forecasting in production.

*Technologies: SARIMAX / time-series forecasting, BI dashboarding platforms, automated data pipelines, Python, SQL.*
