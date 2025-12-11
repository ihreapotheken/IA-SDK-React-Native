#!/bin/bash

# https://typedoc.org/index.html
#
# Usage:
#
# sh ./scripts/generate-docs.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."

# Change current working directory.
cd "$PROJECT_DIR" 

# Generate the documentation to the `docs` directory.
npm run docs