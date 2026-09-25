# Spec Delta

## Purpose

Let users select and customize a one-page CV design, including one-column and two-column layouts, without editing shared templates or changing candidate facts.

## ADDED Requirements

### Requirement: Select a design and layout
The system SHALL support named one-page design presets and a layout choice of one column or two columns. An existing workspace with no design configuration SHALL retain the current two-column appearance by default.

#### Scenario: User selects one column
- **WHEN** a variant selects the one-column layout
- **THEN** the generated one-page PDF presents the same resolved CV content in one column

#### Scenario: User selects two columns
- **WHEN** a variant selects the two-column layout
- **THEN** the generated one-page PDF presents the same resolved CV content in two columns

#### Scenario: Existing workspace has no design configuration
- **WHEN** an existing variant is built without any design settings
- **THEN** its one-page PDF uses the current default design

### Requirement: Customize visual settings without changing facts
The system SHALL allow supported settings for page size and margins, font choices and sizes, colors, spacing, and section styling. Workspace defaults and variant overrides SHALL combine predictably; visual settings SHALL not change the resolved candidate facts, role history, or plain-text CV content.

#### Scenario: Variant overrides a workspace setting
- **WHEN** a workspace defines a design default and a variant overrides one supported setting
- **THEN** the variant uses the overridden value and retains the other workspace settings

#### Scenario: Visual design changes
- **WHEN** only design settings change
- **THEN** the generated one-page PDF changes appearance while its resolved CV facts remain the same

### Requirement: Validate and fit every design
The system SHALL reject unknown or invalid design values with an actionable error. It SHALL render with the selected page geometry and fail the build if the final PDF exceeds one page after the supported fit attempts. It SHALL not silently clip content to make it fit.

#### Scenario: Invalid layout value
- **WHEN** a design selects a layout other than one column or two columns
- **THEN** the build fails and names the invalid setting

#### Scenario: Selected design overflows
- **WHEN** content spans more than one PDF page after fit attempts under the selected design
- **THEN** the build fails with an overflow message

### Requirement: Preserve PDF extraction coverage across layouts
Each supported layout SHALL be included in the separate ATS PDF evidence checks using fictional content before the layout is considered ready.

#### Scenario: One-column layout is introduced
- **WHEN** the one-column layout is added
- **THEN** automated PDF extraction checks cover both one-column and two-column outputs

### Requirement: Agentic tailoring honors design preference
The shared tailoring skill SHALL use a user's explicit supported preset or layout choice when creating a variant, and SHALL otherwise use the workspace default or existing two-column default. It SHALL give the same behavior through Codex, Claude Code, and Cursor entry points without requiring users to edit a design file for an ordinary tailoring request. It SHALL report invalid or unfit design choices rather than silently switching layouts or changing candidate facts.

#### Scenario: User requests one column while tailoring
- **WHEN** a user asks a supported agent to tailor a job using one column
- **THEN** the agent records that choice for the variant and builds a one-column PDF

#### Scenario: User states no design preference
- **WHEN** a user asks a supported agent to tailor a job without design instructions
- **THEN** the agent uses the configured workspace default or current two-column default without requesting an extra choice

#### Scenario: Requested layout cannot fit
- **WHEN** the selected layout still overflows after evidence-safe trimming and supported fit attempts
- **THEN** the agent reports the overflow and keeps the requested layout rather than silently changing it
