# AI knowledge management for an internal AI data assistant (Semrush)

## Problem
The company's internal AI data assistant (a natural-language data Q&A tool used company-wide) answered from knowledge hardcoded inside its own skill definitions — disconnected from the metric and table definitions actually governed in the data catalog and transformation layer. Definitions weren't authored for AI consumption (no caveats, freshness, or certification status attached), there was no lifecycle to propagate a governed definition into the assistant, and no systematic way to detect when it answered incorrectly.

## What I did
- Co-designed and helped launch a 6-month MVP program to make the knowledge feeding the AI assistant manageable, certified, and measurable, scoped to the ten highest-impact questions the assistant was asked.
- Designed a two-store "AI Knowledge Base" architecture: a structured catalog half (glossary, lineage, certification flags) paired with a version-controlled Git repository holding narrative definitions, caveats, and decision records, reviewed via merge request.
- Defined a "Certified for AI" content standard and a knowledge-classification scheme (certified/uncertified) that drives a per-answer confidence signal shown to users of the assistant.
- Owned, on behalf of Data Governance, the capability of accumulating and storing this certified knowledge — one of five accountable capabilities in a cross-functional RACI spanning an AI/analytics engineering team, a data-quality team, and metric/data owners.
- Coordinated the overall initiative across those teams as the named coordinator.

## Scale & outcome
- Proved the model on a pilot scope (10 questions + underlying metrics) intended as the template for scaling knowledge certification to the rest of the AI assistant's coverage.
- Shifted the assistant's knowledge model from "hardcoded, drifting text" to "reads live from a governed, versioned source at answer time."

## Technologies
Git-based knowledge repositories (MR/review workflow), metadata/catalog platform, MCP-based AI tool integration, internal conversational AI / data-assistant systems.

Source: `PROJECTS/AI KM/AI KM — Home.md`, `PROJECTS/AI KM/Project "MVP of AI Knowledge Management".md` (vault, sanitized — colleague names and internal tool name replaced with role/generic descriptions)
