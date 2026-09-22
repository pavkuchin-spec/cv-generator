.PHONY: build rebuild probe ingest
build:
	@if [ -z "$(VARIANT)" ]; then \
		echo "usage: make build VARIANT=<slug>"; \
		exit 1; \
	fi
	node build.mjs $(VARIANT) $(if $(WORKSPACE),--workspace $(WORKSPACE),)

# No-agent PDF render. VARIANT optional — infers from cwd or last-saved onepager.yaml.
rebuild:
	@node scripts/rebuild.mjs $(VARIANT) $(if $(WORKSPACE),--workspace $(WORKSPACE),)

# Re-check live Greenhouse/Ashby tokens in the active workspace.
# Does not fetch JDs, score cards, or write shortlist.md — that's `make ingest`.
probe:
	node scripts/probe.mjs $(if $(VERBOSE),--verbose,) $(if $(WORKSPACE),--workspace $(WORKSPACE),)

# Score configured watchlists and write the active workspace's shortlist.
ingest:
	node scripts/ingest.mjs $(if $(VERBOSE),--verbose,) $(if $(REPLAY_ONLY),--replay-only,) $(if $(WORKSPACE),--workspace $(WORKSPACE),)
