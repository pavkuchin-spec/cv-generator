# Event-driven billing workflow

## Problem
Synchronous billing updates created long request times and coupled product releases to downstream accounting services.

## What the candidate did
- Designed a Kafka-based workflow with explicit event contracts and consumer ownership.
- Added dead-letter handling, replay tooling, and end-to-end correlation identifiers.
- Coordinated rollout across product, finance engineering, and platform teams.

## Scale and outcome
- Processes 8 million events per month.
- Removed billing work from the customer request path and enabled independent service releases.

## Result lenses
- **Scale** - 8 million events per month across three services.
- **Help** - product teams release independently; support can trace billing state end to end.
- **Problems** - slow requests, tight service coupling, and opaque retry failures.
- **Leadership** - led design, migration, and operational readiness.

## Technologies
Go, Kafka, PostgreSQL, Kubernetes, OpenTelemetry.

Source: fictional demonstration scenario created for this repository.
