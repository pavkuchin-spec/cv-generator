# Authentication & authorization architecture (Sibedge, Legato Data Platform)

## Problem
An enterprise data platform needed a consistent way to manage user permissions across multiple independent data services, with a reliable audit trail and permissions that stayed consistent as data and access changed across the ecosystem.

## What I did
- Designed a role-based access control (RBAC) system spanning 7 data services, with a complete audit trail of access decisions.
- Designed an event-driven architecture using Kafka to propagate permission changes consistently across the entire data ecosystem, rather than relying on point-to-point synchronization between services.

## Scale & outcome
RBAC and audit-trail design adopted as the authentication architecture for the platform's 7 constituent data services.

## Result lenses
- **Scale** — an RBAC design spanning the platform's 7 constituent data services, with a complete audit trail of access decisions.
- **Help** — none recorded. This dossier captures no user- or team-level impact and its source carries none; do not invent one.
- **Problems** — permissions drifting out of consistency across independent services as data and access changed, addressed by propagating permission changes through an event-driven Kafka architecture rather than point-to-point synchronization between services; and the absence of a reliable audit trail.
- **Leadership** — the design was adopted as the authentication architecture for all 7 of the platform's data services; no team or delivery ownership is recorded for this role.

## Technologies
RBAC design, Apache Kafka, event-driven architecture, enterprise data platform systems analysis.

Source: `CV_DG_team_lead.pdf` (role predates the Work vault; no deeper notes exist — do not expand beyond what's stated here)
