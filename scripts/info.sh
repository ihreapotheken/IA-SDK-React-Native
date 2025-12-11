#!/bin/bash

# Display an informative message to the terminal. 
#
# Usage:
#
# sh ./scripts/info.sh "This is an informative message"

echo
echo
echo "------------------------"
echo
echo
echo ${1:-"No message provided."}
echo
echo
