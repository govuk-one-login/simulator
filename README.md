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
- You **must** use a `GET` request with query parameters when making a request to `/authorize`. The simulator does not[support request objects](https://openid.net/specs/openid-connect-core-1_0.html#:~:text=%C2%A0TOC-,3.1.2.1.%C2%A0%20Authentication%20Request,-An%20Authentication%20Request) or the `POST` method for authorization requests.

## Configuration

### Setting up configuration:

The client, response and error configuration for the simulator can be set up in one of two ways:

1. Using environment variables - These are best suited for static configuration, which shouldn't change frequently
2. Making a POST request to the `/config` endpoint to update the configuration - This is best for configuration which will be frequently updated

**Note: The `/config` endpoint will overwrite any fields set as environment variables whilst the docker container is running.**

Parameters provided as environment variables that are parsed as an array should be set as a comma separated string, for example:
`CLIENT_LOCS=P0,P2`

Where values are not provided for the configuration, [default values](#default-configuration-values) will be used. Some provided configuration fields may be ignored if they are not valid.

### Client Configuration

The table below describes the different fields for the client configuration. When updating the client config using the `/config` endpoint, the following JSON structure is required in the request body:

```json
{
  "clientConfiguration": {
    "clientId": "aClientId",
    "scopes": ["openid", "phone", "email"],
    ...other fields
  },
}
```

| Field                           | Description                                                                                     | Environment Variable              | Config request field          | Valid values                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Client Id                       | The public identifier for a client                                                              | `CLIENT_ID`                       | clientId                      | Any string                                                                                                                                                                                                                                                                                       |
| Public Key                      | The public key which should be used to validate the client_assertion signature                  | `PUBLIC_KEY`                      | publicKey                     | PEM encoded public key                                                                                                                                                                                                                                                                           |
| Scopes                          | The scopes which the client is configured to request                                            | `SCOPES`                          | scopes                        | "openid", "email", "phone"                                                                                                                                                                                                                                                                       |
| Redirect URLs                   | The redirect URLs for the client, which a user will be redirected to                            | `REDIRECT_URLS`                   | redirectUrls                  | Any valid URLs                                                                                                                                                                                                                                                                                   |
| Claims                          | The claims which the client is configured to request                                            | `CLAIMS`                          | claims                        | "https://vocab.account.gov.uk/v1/passport", "https://vocab.account.gov.uk/v1/address", "https://vocab.account.gov.uk/v1/drivingPermit", "https://vocab.account.gov.uk/v1/socialSecurityRecord", "https://vocab.account.gov.uk/v1/coreIdentityJWT", "https://vocab.account.gov.uk/v1/returnCode", |
| Identity Verification Supported | Whether or not the client has identity verification enabled                                     | `IDENTITY_VERIFICATION_SUPPORTED` | identityVerificationSupported | boolean                                                                                                                                                                                                                                                                                          |
| ID Token Signing Algorithm      | The algorithm which the id token should be signed with                                          | `ID_TOKEN_SIGNING_ALGORITHM`      | idTokenSigningAlgorithm       | "ES256" or "RS256"                                                                                                                                                                                                                                                                               |
| Client Levels of Confidence     | The levels of confidence values which the client can request                                    | `CLIENT_LOCS`                     | clientLoCs                    | "P0", "P1", "P2"                                                                                                                                                                                                                                                                                 |
| Post Logout redirect URIs       | The redirect URIs configured for a client for a user to be redirected to after being logged out | `POST_LOGOUT_REDIRECT_URLS`       | postLogoutRedirectUrls        | Any valid URLs                                                                                                                                                                                                                                                                                   |

### Response Configuration:

The table below describes the different fields for the response configuration. When updating the response config using the `/config` endpoint, the following JSON structure is required in the request body:

```json
{
  "responseConfiguration": {
    "sub": "someSubjectIdentifier",
    "email": "anExampleEmail@example.com" ,
    ...other fields
  },
}
```

Some response configuration fields are not available to be set as environment variables.

| Field                             | Description                                                                                                                                                                                          | Environment Variable  | Config request field              | Valid values                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------- | ----------------------------------------------------------------- |
| sub                               | The returned pairwise subject identifier                                                                                                                                                             | SUB                   | sub                               | any string                                                        |
| email                             | The returned email address                                                                                                                                                                           | EMAIL                 | email                             | any string                                                        |
| emailVerified                     | Whether or not the email address has been verified                                                                                                                                                   | EMAIL_VERIFIED        | emailVerified                     | boolean                                                           |
| phoneNumber                       | The returned phone number                                                                                                                                                                            | PHONE_NUMBER          | phoneNumber                       | any string                                                        |
| phoneNumberVerified               | Whether or not the phone number has been verified                                                                                                                                                    | PHONE_NUMBER_VERIFIED | phoneNumberVerified               | boolean                                                           |
| maxLoCAchieved                    | The maximum Level of Confidence the user achieved                                                                                                                                                    | N/A                   | maxLoCAchieved                    | any string                                                        |
| coreIdentityVerifiableCredentials | A core identity Verifiable credential                                                                                                                                                                | N/A                   | coreIdentityVerifiableCredentials | JSON Object                                                       |
| passportDetails                   | A set of passport details to be returned                                                                                                                                                             | N/A                   | passportDetails                   | JSON Array                                                        |
| drivingPermitDetails              | A set of driving license details to be returned                                                                                                                                                      | N/A                   | drivingPermitDetails              | JSON Array                                                        |
| socialSecurityRecordDetails       | A set of social security record details to be returned                                                                                                                                               | N/A                   | socialSecurityRecordDetails       | JSON Array                                                        |
| postalAddressDetails              | A set of address details to be returned                                                                                                                                                              | N/A                   | postalAddressDetails              | JSON Array                                                        |
| returnCodes                       | A set of return codes to be returned if the return code claim is included in the client configuration and `/authorize` request. Otherwise an ACCESS_DENIED error is returned when this is configured | N/A                   | returnCodes                       | JSON Array with the following structure `[{"code": "anyString"}]` |

Where the above valid values are JSON objects/JSON arrays, no further validation is done on the provided response configuration unless outlined. You should consult the technical docs for examples of what these fields should look like.

### Error configuration:

You can setup the simulator to return specific error scenarios at the `/authorize` endpoint, and in the Core Identity JWT and ID Token issued. There are no defaults configured for the error configuration, so you must provide these if you wish to enable the simulator to return an error.

Multiple error states can be enabled and these can be passed as a comma separated string to the following environment variables:
`CORE_IDENTITY_ERRORS`, `ID_TOKEN_ERRORS`, `AUTHORISE_ERRORS`

Alternatively these can be set using the `/config` endpoint with the following syntax

```json
{
  "errorConfiguration": {
    "coreIdentityErrors": ["INVALID_ALG_HEADER"],
    "idTokenErrors": ["INVALID_ISS"],
    "authoriseErrors": ["ACCESS_DENIED"]
  }
}
```

Any invalid values for the error configuration will be ignored.

#### Authorise errors:

These are errors returned at the point in which a user hits the `/authorize` endpoint

| Error type    | Description                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ACCESS_DENIED | Returns the access denied error that would be returned to an RP when a user has issues with identity, but does not have return codes switched on. It is returned just before an auth code is generated |

#### ID token errors:

These are errors which are present in the issued ID token

| Error type          | Description                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| INVALID_ISS         | ID token has an invalid issuer.                                                                                              |
| INVALID_AUD         | ID token has an invalid audience.                                                                                            |
| INVALID_ALG_HEADER  | The alg in the header does not match the algorithm returned from the JWKS endpoint.                                          |
| INVALID_SIGNATURE   | The signature of the token is invalid.                                                                                       |
| TOKEN_EXPIRED       | The expiry date of the token is in the past.                                                                                 |
| TOKEN_NOT_VALID_YET | The iat claim of the token is in the future.                                                                                 |
| NONCE_NOT_MATCHING  | The nonce in the token does not match the nonce supplied in the /authorize request.                                          |
| INCORRECT_VOT       | The vector of trust (vot) returned in the token does not match the vector of trust requested (vtr) in the /authorize request |

#### Core Identity errors:

These are errors which are present in the issued Core Identity JWT.

| Error type         | Description                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| INVALID_ALG_HEADER | The alg in header is not ES256.                                                                          |
| INVALID_SIGNATURE  | The signature of the token is invalid.                                                                   |
| INVALID_ISS        | Core identity has an invalid issuer                                                                      |
| INVALID_AUD        | Core identity has an invalid audience.                                                                   |
| INCORRECT_SUB      | The sub does not match the sub in the id_token. Sub is the subject identifier or the unique ID of a user |
| TOKEN_EXPIRED      | The expiry date of the token has passed                                                                  |

To remove an error configuration, you can either unset the environment variables mentioned above, or you can POST the config endpoint **without** the `errorConfiguration` field in the body.

> [!NOTE]  
> Anytime you update your configuration using the `/config` endpoint you **must** include the errorConfiguration if you wish to maintain the configured errors

#### URL configuration:

You may wish to deploy the simulator and you can therefore configure the URL at which the simulator is hosted. This is done via the environment variable: `SIMULATOR_URL`.
Alternatively the url can be updated using the `/config` endpoint with the following request body field:

```json
{
  "simulatorUrl": "https://example.com/deployed-simulator"
}
```

**Note: When modifying the simulator URL, this will affect the other endpoints and any validation that includes these endpoints.**

> For example: The token endpoint will become`${SIMULATOR_URL}/token`, so the expected audience of the client assertion should be updated to reflect this.

#### Default configuration values:

The default values for each configurable field are outlined below:

| Field                             | Default Value                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Client Id                         | `HGIOgho9HIRhgoepdIOPFdIUWgewi0jw`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Public Key                        | `-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmXXR3EsRvUMVhEJMtQ1wexJjfQ00Q0MQ7ARfShN53BnOQEPFnS/I8ntBddkKdE3q+vMTI72w6Fv3SsMM+ciR2LIHdEQfKgsLt6PGNcV1kG6GG/3nSW3psW8w65Q3fmy81P1748qezDrVfaGrF4PDXALzX1ph+nz8mpKmck6aY6LEUJ4B+TIfYzlKmmwFe3ri0spSW+J5wE9mmT3VkR2ySuHRYHQlxlF9dfX7ltOTsbgJFzN6TO01ZQDhY0iLwzdGwhSxO6R6N/ZINYHCKFPaQD+tdKsrw7QDIYnx0IiXFnkGnizl3UtqSmXAaceTvPM2Pz84x2JiwHrp2Sml6RYLCQIDAQAB-----END PUBLIC KEY-----` |
| Scopes                            | `["openid", "email", "phone"]`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Redirect URLs                     | `["http://localhost:8080/oidc/authorization-code/callback"]`                                                                                                                                                                                                                                                                                                                                                                                                 |
| Claims                            | `["https://vocab.account.gov.uk/v1/coreIdentityJWT","https://vocab.account.gov.uk/v1/address","https://vocab.account.gov.uk/v1/returnCode"]`                                                                                                                                                                                                                                                                                                                                                                                                        |
| Identity Verification Supported   | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ID Token Signing Algorithm        | `ES256`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Client Levels of Confidence       | `["P0", "P2"]`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| sub                               | `urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=`                                                                                                                                                                                                                                                                                                                                                                                           |
| email                             | `test@example.com`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| emailVerified                     | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| phoneNumber                       | `07123456789`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| phoneNumberVerified               | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| maxLoCAchieved                    | `P2`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| coreIdentityVerifiableCredentials | `{"type":["VerifiableCredential","IdentityCheckCredential"],"credentialSubject":{"name":[{"nameParts":[{"value":"GEOFFREY","type":"GivenName"},{"value":"HEARNSHAW","type":"FamilyName"}]}],"birthDate":[{"value":"1955-04-19"}]}}`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| passportDetails                   | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| drivingPermitDetails              | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| socialSecurityRecordDetails       | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| postalAddressDetails              | `{"postalAddressDetails":[{"addressCountry":"GB","buildingName":"","streetName":"FRAMPTON ROAD","postalCode":"GL1 5QB","buildingNumber":"26","addressLocality":"GLOUCESTER","validFrom":"2000-01-01","uprn":100120472196,"subBuildingName":""}]}`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| returnCodes                       | `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| simulatorUrl                      | `http://localhost:3000`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| postLogoutRedirectUrls            | `["http://localhost:8080/signed-out]`                                                                                                                                                                                                                                                                                                                                                                                                                        |

The private key for the default public key is:

```
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCZddHcSxG9QxWE
Qky1DXB7EmN9DTRDQxDsBF9KE3ncGc5AQ8WdL8jye0F12Qp0Ter68xMjvbDoW/dK
wwz5yJHYsgd0RB8qCwu3o8Y1xXWQboYb/edJbemxbzDrlDd+bLzU/Xvjyp7MOtV9
oasXg8NcAvNfWmH6fPyakqZyTppjosRQngH5Mh9jOUqabAV7euLSylJb4nnAT2aZ
PdWRHbJK4dFgdCXGUX119fuW05OxuAkXM3pM7TVlAOFjSIvDN0bCFLE7pHo39kg1
gcIoU9pAP610qyvDtAMhifHQiJcWeQaeLOXdS2pKZcBpx5O88zY/PzjHYmLAeunZ
KaXpFgsJAgMBAAECggEAGtEkgb8ak/zPm0OsvOzizZb6jMVMbz6ei+f9sOezYVuf
F8rgEyZhEsKoP0xUz9s352+n1hSVgB1mGwn30ASVPA1sUQyAd6vjec1kW0wszbcK
t4SIsOPEtU2NenV1tyGQZBYB2t4zHtRfL2ubhunvLzqSxgR437mMuQRMkugagbOQ
CRPhwslZECcZvmOh5HURkbE0L5F1uXckc+tf0hktgiI4LB+Eej9e4TkhHnv6B9pe
yejfk/O+48O3sZ2emYgY6TSqcgwutj6UipROknyAorWUQ8vTaSewm6HO++cRH5a/
D0JPoLX7uM8JcosIIiLE1p6qihjhPRe65Rvb7tSMOwKBgQDQBMHkETsQlb26vGhm
9Fc29GQJFe0yTZVD/94U98hpfbOu22E3TslXzpsNoCR61zgZdM7dWQINi3AvonFS
QJlDEYGNX0zYOqT1goI+3tBMpptnNzfgRN72bp748JiUyWLnjcWUNc2gwIEc2yET
wR4Zxz6A7h1iA9+fM/rEE1ULHwKBgQC823VoUO7p13WvdrYrmM93Xc6Cv5nZFLZn
bFjt4xwi096yJ2BTxARFhCBYaDD9vi4yzKjHih/1G53T6aaRbuLaNOSO58jHY1eh
par1Xw+JjKwK7bnFGOY+mGAT9kz/agDQv+ELu6PpgiRW/Awiz9UW5OV0cquQIhRj
60yn25PM1wKBgQCI2YhhLUDJUWnHbunUSY0S90bUf1tTy5yWZr9I1hY/6FWMhID5
bNii7qYtGZzGP86FWMY68rKaDJDalaitrxfk+qBbTEX2vuYFKj3bdKReuQDlr3sQ
DN8OCoqFRWtr/u0VXryMG7VSuzJ1tGeXYmYWGXEySvSDpf648u5XjkxViwKBgQCO
+9COJAhePuQ47jXKGC2q//ikARAnzIi1ENDbeoEI1UPbufgyM0vQndInXOsKkXxE
tbJrMGY1mq0JjfKwVTWnYzhQAah/XPUxy0396/TFfR2cQJPPZ6Saa58CPg3ZqpXn
df6adXwKBKAiwz0k9hks9ivK2C6QN10csT8eLx5djQKBgQCiVnIJ3JcjNXHlygCW
eZG4zLcylZXusOv3VYBJKypBLVI74buoFfrvMcV/lQrI3Yo+6V95rNYGm+2MVxIc
iZSejbyqjUjJBAH9GHkPsiA+w1vutdd2PuPKOV05TLmV5ZM06bmLHQjMCGMiWK0G
8qVxFvr2NWRDB3otAjxVHR/ZQA==
-----END PRIVATE KEY-----
```
