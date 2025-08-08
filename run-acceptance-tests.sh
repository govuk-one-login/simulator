#!/bin/bash

# shellcheck source=/dev/null
set -o allexport && source .env && set +o allexport && set -e

ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  export SELENIUM_IMAGE="seleniarm/standalone-chromium:latest"
else
  export SELENIUM_IMAGE="selenium/standalone-chromium:latest"
fi

docker compose --file acceptance-tests-local.docker-compose.yaml up -d
echo "Waiting for a second for ports to open"
sleep 1
npm run acceptance-test
