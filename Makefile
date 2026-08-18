.PHONY: build
build:
	@if [ -z "$(VARIANT)" ]; then \
		echo "usage: make build VARIANT=<slug>"; \
		exit 1; \
	fi
	node build.mjs $(VARIANT)
