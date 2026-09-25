# ats-pdf-evidence Specification

## Purpose

Provide reproducible evidence that each generated one-page CV PDF exposes its essential candidate facts as extractable text, with clear failures and advisory reading-order findings.

## Requirements

### Requirement: Verify the generated PDF
The system SHALL extract text from the generated one-page CV PDF and compare it with the resolved source content used for that PDF. It SHALL NOT treat the separately generated plain-text CV or job-keyword report as proof of PDF extraction.

#### Scenario: PDF contains the resolved core facts
- **WHEN** a one-page CV PDF is generated with extractable name, contact details, work employers, held titles and dates, and education facts
- **THEN** the verification passes its core-fact checks against the resolved source content

#### Scenario: A core fact is absent from the PDF text
- **WHEN** at least one resolved core fact cannot be found in the extracted PDF text
- **THEN** the build fails and identifies the missing fact by field and source location

### Requirement: Report extraction evidence and reading order
The system SHALL produce a local report stating the layout checked, extraction result, core-fact results, and section-order findings. It SHALL mark uncertain reading-order findings as advisory rather than failing a build that contains all core facts. It SHALL distinguish verified text extraction from untested commercial ATS behavior.

#### Scenario: Section order is uncertain
- **WHEN** extracted section headings or content appear in an unexpected order but all core facts are present
- **THEN** the build succeeds and the report flags the affected order for human review

#### Scenario: Extraction cannot be completed
- **WHEN** the PDF cannot be read or its text cannot be extracted
- **THEN** the build fails with an extraction error rather than claiming the CV passed

### Requirement: Cover supported layouts with fictional data
The project SHALL provide repeatable checks of the generated PDF for every supported one-page layout using fictional candidate data. Results and generated PDFs SHALL remain untracked, and the checks SHALL not require real candidate information.

#### Scenario: A layout is added
- **WHEN** a new one-page layout becomes supported
- **THEN** automated PDF extraction coverage includes that layout before it is considered complete

#### Scenario: A fictional fixture is tested
- **WHEN** the project's ATS evidence tests run
- **THEN** they render fictional source data and check the resulting PDF text for core facts

### Requirement: Agentic tailoring exposes the PDF result
The repository SHALL provide a portable tailoring skill that applies the same evidence, truthfulness, and privacy rules across agents, with discoverable entry points for the repo's supported Codex, Claude Code, and Cursor hosts. The existing Claude `/tailor` entry point SHALL remain usable. Tailoring SHALL run the PDF check through the build and report pass, advisory reading-order findings, or failure to the user. A render-only rebuild SHALL not re-tailor source content.

#### Scenario: Supported agent tailors a job
- **WHEN** a user asks any supported agent to tailor a job description
- **THEN** the agent creates an evidence-backed variant, builds it, and reports the PDF verification result with its content gaps

#### Scenario: User rebuilds an existing variant
- **WHEN** a user invokes a render-only rebuild
- **THEN** the PDF verification runs on the rebuilt PDF without rewriting tailored prose
