#!/bin/bash

set -euo pipefail

function get_env_vars_from_SSM() {

  echo "Getting environment variables from SSM ... "
  VARS="$(aws ssm get-parameters-by-path --with-decryption --path /tests/build-orch-be-deploy/ | jq -r '.Parameters[] | @base64')"
  for VAR in $VARS; do
    VAR_NAME="$(echo ${VAR} | base64 -d | jq -r '.Name / "/" | .[3]')"
    export "$VAR_NAME"="$(echo ${VAR} | base64 -d | jq -r '.Value')"
  done
  echo "Export SSM parameters completed."
}

get_env_vars_from_SSM

TEST_EXIT_CODE=0
npm run acceptance-test || TEST_EXIT_CODE=$?

cp reports/cucumber-report.json ${TEST_REPORT_ABSOLUTE_DIR:-/tests}/report.json

exit $TEST_EXIT_CODE

