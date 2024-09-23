#/usr/bin/env bash

# Todo: Replace this script with a TS/JS script that is platform-agnostic, so doesn't care about line endings being CRLF or LF

DIR_TO_SCAN="/workspaces/db23/data/json/markers"

find ${DIR_TO_SCAN} -maxdepth 1 -type f -name "*.json" -exec sha256sum "{}" \; > ${DIR_TO_SCAN}/${1}
