# Authentication & authorization architecture (Sibedge, Legato Data Platform)

## Problem
An enterprise data platform needed a consistent way to manage user permissions across multiple independent data services, with a reliable audit trail and permissions that stayed consistent as data and access changed across the ecosystem.

## What I did
- Designed a role-based access control (RBAC) system spanning 7 data services, with a complete audit trail of access decisions.
- Designed an event-driven architecture using Kafka to propagate permission changes consistently across the entire data ecosystem, rather than relying on point-to-point synchronization between services.

## Scale & outcome
RBAC and audit-trail design adopted as the authentication architecture for the platform's 7 constituent data services.

## Technologies
RBAC design, Apache Kafka, event-driven architecture, enterprise data platform systems analysis.

Source: `CV_DG_team_lead.pdf` (role predates the Work vault; no deeper notes exist — do not expand beyond what's stated here)
