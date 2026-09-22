---
description: Render CV PDFs only — no tailoring, no copy edits
---

Run this and then **stop**. Do not tailor. Do not edit any file.

```
node scripts/rebuild.mjs
```

If the user named a variant or has a `variants/<slug>/` file open, pass that slug or path as the argument.

Print the command's stdout/stderr verbatim. If the build fails, report that and stop. Do not apply the cut order, do not read the evidence bank, do not rewrite copy.
