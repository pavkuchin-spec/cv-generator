.PHONY: build probe ingest
build:
	@if [ -z "$(VARIANT)" ]; then \
		echo "usage: make build VARIANT=<slug>"; \
		exit 1; \
	fi
	node build.mjs $(VARIANT)

# Re-check live Greenhouse/Ashby tokens in inbox/prefs.yaml (HTTP 200 + title scan).
# Does not fetch JDs, score cards, or write shortlist.md — that's `make ingest`.
probe:
	node scripts/probe.mjs $(if $(VERBOSE),--verbose,)

# Title-prefilter watchlists, fetch ≤15 JDs, score, write inbox/shortlist.md.
# Empty Prep is valid. Replay of the 18 Aug Collibra/Elastic/N26 set must stay Later/Skip.
ingest:
	node scripts/ingest.mjs $(if $(VERBOSE),--verbose,) $(if $(REPLAY_ONLY),--replay-only,)
