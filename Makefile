.PHONY: build probe
build:
	@if [ -z "$(VARIANT)" ]; then \
		echo "usage: make build VARIANT=<slug>"; \
		exit 1; \
	fi
	node build.mjs $(VARIANT)

# Re-check live Greenhouse/Ashby tokens in inbox/prefs.yaml (HTTP 200 + title scan).
# Does not fetch JDs, score cards, or write shortlist.md — that's scripts/ingest.mjs (Thu).
probe:
	node scripts/probe.mjs $(if $(VERBOSE),--verbose,)
