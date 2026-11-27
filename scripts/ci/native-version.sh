#!/usr/bin/env bash
# Prints the native build version YYYY.MM.DD.MIN (date + minutes-since-midnight),
# the same scheme the demo-app deploy uses (scripts/dev-env-setup.sh). Stable
# within a given minute so Android's mavenLocal publish + the wrapper's resolve agree.
set -euo pipefail
DATE="$(date +%Y.%m.%d)"
MIN="$(( $(date +%H) * 60 + $(date +%M) ))"
echo "${DATE}.${MIN}"
