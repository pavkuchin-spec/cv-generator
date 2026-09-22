# Reliable checkout API

## Problem
The subscription checkout endpoint retried non-idempotent operations during upstream timeouts, producing duplicate work and an elevated customer-visible error rate.

## What the candidate did
- Added idempotency keys and a durable request-state model.
- Separated safe retries from operations requiring reconciliation.
- Added service-level indicators, trace sampling, and an on-call runbook.

## Scale and outcome
- Reduced checkout API error rates from 1.8% to 0.3%.
- Cut median incident recovery time by 45%.

## Result lenses
- **Scale** - customer checkout traffic for a subscription analytics product.
- **Help** - customers completed checkout more reliably; on-call engineers diagnosed failures faster.
- **Problems** - duplicate work, unsafe retries, and slow incident diagnosis.
- **Leadership** - owned the redesign from failure analysis through rollout and monitoring.

## Technologies
TypeScript, PostgreSQL, Redis, OpenTelemetry, Kubernetes.

Source: fictional demonstration scenario created for this repository.
