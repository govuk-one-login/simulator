# GOV.UK One Login Simulator

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

## Using the simulator:

The GOV.UK One Login simulator is a development tool that lets you run end-to-end tests, so you can:

- test and verify specific user information such as names and email addresses
- request specific error codes and learn more about what they mean in a test environment
- test integrations with GOV.UK One Login without going through account creation

The simulator runs locally on your machine, or can be deployed. The simulator is distributed as a Docker image and is deployed via GitHub. The GOV.UK One Login team runs nightly acceptance tests against the live system, so you’ll always be testing with the most up-to-date version of GOV.UK One Login.

The simulator stands in as GOV.UK One Login in acting as the [OpenID Provider (OP)](https://openid.net/specs/openid-connect-core-1_0.html#:~:text=%C2%A0TOC-,1.3.%C2%A0%20Overview,-The%20OpenID%20Connect) for Relying Parties (RP) to test their integration.

The simulator provides similar testing functionality as building mocks but without the need for you to build anything yourself. This means the simulator is a quicker and easier way of testing your setup. The simulator also lets you use your own test data, meaning you can test a wider range of scenarios.

```mermaid
sequenceDiagram
    RP->>Simulator:/authorize
    Simulator-)RP: Redirect URL + Auth code
    RP->>Simulator:/token
     Simulator-)RP: access_token and id_token
     RP->>Simulator:/userinfo
```

### RP Requirements to use the Simulator:

The simulator aims to mirror GOV.UK One Login but does not support all of the features, therefore there are some limitations to what RP features it supports:

- You **must** use the[`private_key_jwt` authentication method](https://openid.net/specs/openid-connect-core-1_0.html#:~:text=OAuth.JWT%5D.-,private_key_jwt,-Clients%20that%20have) at the `/token` endpoint
- You **must** attach a `nonce` parameter in the `/authorize` request
- You **must** use a `GET` request with either query parameters or a [request object](https://openid.net/specs/openid-connect-core-1_0.html#:~:text=%C2%A0TOC-,3.1.2.1.%C2%A0%20Authentication%20Request,-An%20Authentication%20Request) when making a request to `/authorize`. The simulator does not support the `POST` method for authorization requests.

## Documentation:

- [Setting up configuration](./docs/configuration.md)
- [Configuring Errors](./docs/configured-errors.md)
- [Default configuration values](./docs/default-config-values.md)
- [Running the simulator in interactive mode](./docs/interactive-mode.md)
