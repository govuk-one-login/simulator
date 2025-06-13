# Developing for the GOV.UK One Login Simulator
These instructions are primarily intended for developers working on GOV.UK One Login.

We would be happy to accept contributions from elsewhere, but cannot guarantee that we will be able to accept every change.
For example, we will be unable to accept new features that the team would be unable to support on an ongoing basis.

You can use a GitHub issue to get feedback on new features before you begin.

## Local Setup

To run the stub locally, you can simply run `docker compose up --build`.

If you would like to run it alongside an RP running locally in Docker, you'll need to turn on Docker host networking.
This requires v4.34 or higher of Docker Desktop. In Docker Desktop, go into Settings -> Resources -> Network, and tick
`Enable host networking`. In your docker compose file for the RP, add `network_mode: host` under the service that you're running.
<br />

### Development environment setup:

_Please ensure you are using the correct node version locally (Found in Dockerfile)_

#### Build

> To build the app

```shell script
npm install && npm run build
```

#### Start

> To start the app

```shell script
npm run build && npm run start
```

<br />

## Formatting & Linting

### Scripts:

> To check:

```shell script
npm run check; # Check all
npm run check:pretty; # Check prettier
npm run check:lint; # Check linting
```

> To fix formatting/linting:

```shell script
npm run fix; # Fix all
npm run fix:pretty; # Fix prettier
npm run fix:lint; # Fix linting
```

> To setup pre-commit hook

```shell script
npm run prepare
```
## Tests
### Unit tests/Integration tests

> To run all unit tests and integration tests, run

```shell script
npm run test
```

### Acceptance tests

To run the acceptance tests locally:
1. Go to the dev account and find the secret storing a copy of the valid `.env` file
2. Retrieve the value and make a copy of this in a local `.env` file
3. Run the acceptance tests with the following command:
```shell script
./run-acceptance-tests.sh
```

These tests will generate a report with screenshots that you can view at `reports/cucumber-report.html`

