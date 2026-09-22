---
description: Render PDFs only — no tailoring, no copy edits
argument-hint: optional slug or path
---

Run this and then **stop**. Do not tailor. Do not edit any file.

```
node scripts/rebuild.mjs $ARGUMENTS
```

If `$ARGUMENTS` is empty, run it with no args (the script infers the variant from cwd or the most recently saved `onepager.yaml`).

Print the command's stdout/stderr verbatim. If the build fails (overflow, YAML, missing slug), report that and stop so the human can edit and rerun. Do not apply the cut order or rewrite source content.
