#/usr/bin/env bash
DIR_TO_SCAN="/workspaces/db23/data/json/markers"

find ${DIR_TO_SCAN} -maxdepth 1 -type f -name "*.json" -exec sha256sum "{}" \; > ${DIR_TO_SCAN}/${1}
