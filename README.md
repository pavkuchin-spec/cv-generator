# cv-generator

Generate an evidence-backed one-page CV, project appendix, cover letter, and ATS-friendly text file from structured YAML and Markdown.

The repository ships with a completely fictional software-engineer workspace. No real person's employment history, contact information, job-search preferences, or private source notes are included.

## Try the demo

Requirements: Node.js 20+ and npm.

```sh
npm ci
npm run demo
```

The command renders the fictional base CV under `examples/software-engineer/variants/_base/out/`. Puppeteer installs a compatible browser; set `CV_CHROME_PATH` only when you need to use a system browser instead.

Build the tailored fictional example with:

```sh
node build.mjs exampleworks-senior-backend-engineer --workspace examples/software-engineer
```

## Create a private workspace

```sh
npm run init
```

This copies the example to `.cv-local/workspace` and creates `cv.local.yaml`. Both paths are ignored by Git. Replace the fictional profile and evidence there with your own information, then run:

```sh
npm run rebuild -- _base
```

Workspace selection follows a predictable order:

1. `--workspace <path>`
2. `CV_WORKSPACE`
3. `cv.local.yaml`
4. `examples/software-engineer`

## Tailoring model

- `data/profile.yaml` contains stable facts: contact details, roles, dates, education, certifications, and the complete expertise vocabulary.
- `data/evidence/*.md` is the claim bank. Tailored prose may select and reword claims, but it must not invent scope, technology, metrics, or outcomes.
- `variants/<slug>/` contains a job post, keyword list, one-page overrides, appendix, cover letter, rationale, and generated output.
- The one-page build fails if content spills to a second page. Bullet and keyword reports are advisory and make quality gaps visible.

See `examples/software-engineer` for a complete fictional dataset and `CLAUDE.md` for agent-facing tailoring rules.

## One-page design

For an ordinary application, start with Claude Code or Cursor `/tailor`, or the Codex `$tailor` skill, and include any layout or preset preference in the request. All three use the shared instructions in [the tailoring skill](.agents/skills/tailor/SKILL.md). An existing variant with no design settings keeps the classic two-column A4 design. The build reads optional `<workspace>/data/design.yaml` defaults and then `<workspace>/variants/<slug>/design.yaml` overrides. Design settings change the PDF appearance; they do not change candidate facts or `cv-plain.txt`.

The built-in presets are `classic` (two columns) and `compact` (one column). For example, set workspace defaults in `data/design.yaml`:

```yaml
preset: classic
page:
  size: letter
colors:
  accent: "#304f68"
```

Then select one column for one variant in `variants/<slug>/design.yaml`:

```yaml
layout: one-column
sections:
  headerAlign: left
  ruleStyle: dashed
```

You can also choose `preset: compact` in either file. Supported page sizes are `a4` and `letter`; page margins use millimeters. `fonts` accepts bundled `Roboto` and `Hanken Grotesk`, with sizes in points. `colors` use six-digit hex values. `spacing` values use millimeters. Available keys and bounds are defined in [design.mjs](scripts/lib/design.mjs). Invalid settings identify the key and stop the build. Each design must still fit on one page; the build reports overflow instead of changing the selected layout or clipping content.

## PDF extraction evidence

Each successful build writes `out/ats-evidence.json` next to the one-page PDF. The report names the layout, confirms that the PDF text extractor found the resolved name, contact details, employers, held titles, dates, and education facts, and lists any missing field paths. Missing facts or unreadable PDF text fail the build. Section-order warnings are advisory because a parser may read a two-column page differently from its visual order. A pass shows that these core facts are extractable from this PDF; it does not prove acceptance or ranking by a commercial ATS. The plain-text CV and job keyword report remain separate outputs.

Use `npm run rebuild -- <slug>` to rerender an existing variant and refresh its PDF report without editing tailored content.

## Optional job radar

Radar behavior is configured entirely by `<workspace>/inbox/prefs.yaml`: title bands, geography, review-required seniority, scoring terms, timezone, caps, and watchlists.

Run the offline fictional replay:

```sh
npm run demo:radar
```

Run live configured Greenhouse and Ashby watchlists:

```sh
node scripts/probe.mjs
node scripts/ingest.mjs
```

An empty live watchlist is valid. The radar never submits an application.

## Privacy and tests

```sh
npm test
npm run audit:public
```

The public audit rejects private workspace roots, document binaries, home-directory paths, non-example emails, non-fictional phone numbers, and private-source references. For a migration audit, provide an ignored file containing one private identifier per line:

```sh
npm run audit:public -- --denylist .cv-local/privacy-denylist.txt
```

Generated outputs and private workspaces remain untracked. Before publishing changes, verify both commands pass from a clean clone.

## License

Code and documentation are available under the [MIT License](LICENSE). Vendored fonts retain the licenses described in `templates/fonts/NOTICE.md`.
