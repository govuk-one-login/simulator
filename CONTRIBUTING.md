# Developing for the GOV.UK One Login Simulator
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

## Testing

> To run tests run

```shell script
npm run test
```