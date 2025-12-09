## Configuration

### Setting up configuration:

The client, response and error configuration for the simulator can be set up in one of two ways:

1. Using environment variables - These are best suited for static configuration, which shouldn't change frequently
2. Making a POST request to the `/config` endpoint to update the configuration - This is best for configuration which will be frequently updated

**Note: The `/config` endpoint will overwrite any fields set as environment variables whilst the docker container is running.**

Parameters provided as environment variables that are parsed as an array should be set as a comma separated string, for example:
`CLIENT_LOCS=P0,P2`

Where values are not provided for the configuration, [default values](#default-configuration-values) will be used. Some provided configuration fields may be ignored if they are not valid.

### Getting the current configuration:

To get the current configuration of the simulator, a GET request can be made to the `/config` endpoint. This returns the client configuration, response configuration and error configuration, as well as the url the simulator is running on, in the body of the response.

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

| Field                           | Description                                                                                                                                                                                                                                                                                                                                                 | Environment Variable              | Config request field                           | Valid values                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Client Id                       | The public identifier for a client                                                                                                                                                                                                                                                                                                                          | `CLIENT_ID`                       | clientId                                       | Any string                                                                                                                                                                                                                                                                                       |
| Public Key                      | The public key which should be used to validate the client_assertion signature                                                                                                                                                                                                                                                                              | `PUBLIC_KEY`                      | publicKey                                      | PEM encoded public key                                                                                                                                                                                                                                                                           |
| Public Key Source               | How the public key used to validate the client_assertion signature should be retrieved. Either using a static key setup by the simulator, or a key found on a JWKS endpoint. Note that JWKS only works if you set the `JWKS_URL` field, and include the `kid` of the key you used to sign the request.                                                      | `PUBLIC_KEY_SOURCE`               | publicKeySource                                | Either STATIC or JWKS                                                                                                                                                                                                                                                                            |
| Scopes                          | The scopes which the client is configured to request                                                                                                                                                                                                                                                                                                        | `SCOPES`                          | scopes                                         | "openid", "email", "phone"                                                                                                                                                                                                                                                                       |
| Redirect URLs                   | The redirect URLs for the client, which a user will be redirected to                                                                                                                                                                                                                                                                                        | `REDIRECT_URLS`                   | redirectUrls                                   | Any valid URLs                                                                                                                                                                                                                                                                                   |
| Claims                          | The claims which the client is configured to request                                                                                                                                                                                                                                                                                                        | `CLAIMS`                          | claims                                         | "https://vocab.account.gov.uk/v1/passport", "https://vocab.account.gov.uk/v1/address", "https://vocab.account.gov.uk/v1/drivingPermit", "https://vocab.account.gov.uk/v1/socialSecurityRecord", "https://vocab.account.gov.uk/v1/coreIdentityJWT", "https://vocab.account.gov.uk/v1/returnCode", |
| Identity Verification Supported | Whether or not the client has identity verification enabled                                                                                                                                                                                                                                                                                                 | `IDENTITY_VERIFICATION_SUPPORTED` | identityVerificationSupported                  | boolean                                                                                                                                                                                                                                                                                          |
| ID Token Signing Algorithm      | The algorithm which the id token should be signed with                                                                                                                                                                                                                                                                                                      | `ID_TOKEN_SIGNING_ALGORITHM`      | idTokenSigningAlgorithm                        | "ES256" or "RS256"                                                                                                                                                                                                                                                                               |
| Client Levels of Confidence     | The levels of confidence values which the client can request                                                                                                                                                                                                                                                                                                | `CLIENT_LOCS`                     | clientLoCs                                     | "P0", "P1", "P2", "P3"                                                                                                                                                                                                                                                                           |
| Post Logout redirect URIs       | The redirect URIs configured for a client for a user to be redirected to after being logged out                                                                                                                                                                                                                                                             | `POST_LOGOUT_REDIRECT_URLS`       | postLogoutRedirectUrls                         | Any valid URLs                                                                                                                                                                                                                                                                                   |
| Token authentication method     | The method used to authenticate the client at the `/token` endpoint. Clients configured with `client_secret_post` can only be configured for authentication only. For more information see our documentation [here](https://docs.sign-in.service.gov.uk/before-integrating/integrating-third-party-platform/#set-up-client-secret-using-client-secret-post) | `TOKEN_AUTH_METHOD`               | N/A                                            | `private_key_jwt` or `client_secret_post`                                                                                                                                                                                                                                                        |
| Client secret hash              | An Argon2id hash of the client secret. This should only be set if the token authentication mechanism is set to `client_secret_post`. For more information see our [documentation](client_secret_post)                                                                                                                                                       | N/A                               | `private_key_jwt` or `client_secret_post` URLs |                                                                                                                                                                                                                                                                                                  |
| JWKS URL                        | The URL of a JWKS endpoint to look for the public key used to validate the client_assertion signature.                                                                                                                                                                                                                                                      | `JWKS_URL`                        | jwksUrl                                        | Any valid URL                                                                                                                                                                                                                                                                                    |

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

| Field                             | Description                                                                                                                                                                                          | Environment Variable                | Config request field              | Valid values                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| sub                               | The returned pairwise subject identifier                                                                                                                                                             | SUB                                 | sub                               | any string                                                        |
| email                             | The returned email address                                                                                                                                                                           | EMAIL                               | email                             | any string                                                        |
| emailVerified                     | Whether or not the email address has been verified                                                                                                                                                   | EMAIL_VERIFIED                      | emailVerified                     | boolean                                                           |
| phoneNumber                       | The returned phone number                                                                                                                                                                            | PHONE_NUMBER                        | phoneNumber                       | any string                                                        |
| phoneNumberVerified               | Whether or not the phone number has been verified                                                                                                                                                    | PHONE_NUMBER_VERIFIED               | phoneNumberVerified               | boolean                                                           |
| maxLoCAchieved                    | The maximum Level of Confidence the user achieved                                                                                                                                                    | N/A                                 | maxLoCAchieved                    | any string                                                        |
| coreIdentityVerifiableCredentials | A core identity Verifiable credential                                                                                                                                                                | N/A                                 | coreIdentityVerifiableCredentials | JSON Object                                                       |
| passportDetails                   | A set of passport details to be returned                                                                                                                                                             | N/A                                 | passportDetails                   | JSON Array                                                        |
| drivingPermitDetails              | A set of driving license details to be returned                                                                                                                                                      | N/A                                 | drivingPermitDetails              | JSON Array                                                        |
| postalAddressDetails              | A set of address details to be returned                                                                                                                                                              | N/A                                 | postalAddressDetails              | JSON Array                                                        |
| returnCodes                       | A set of return codes to be returned if the return code claim is included in the client configuration and `/authorize` request. Otherwise an ACCESS_DENIED error is returned when this is configured | N/A                                 | returnCodes                       | JSON Array with the following structure `[{"code": "anyString"}]` |
| Publish new ID token signing keys | Used to enable the publication of new ID token signing keys on the `/.well-known/jwks.json` endpoint                                                                                                 | `PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS` | publishNewIdTokenSigningKeys      | A boolean                                                         |
| Use new ID token signing keys     | Used to enable the usage of new ID token signing keys published on the `/.well-known/jwks.json` endpoint.                                                                                            | `USE_NEW_ID_TOKEN_SIGNING_KEYS`     | useNewIdTokenSigningKeys          | A boolean                                                         |

Where the above valid values are JSON objects/JSON arrays, no further validation is done on the provided response configuration unless outlined. You should consult the technical docs for examples of what these fields should look like.

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

#### Mutually exclusive configuration values:

Some features of the simulator are not available to be enabled together. In these cases the simulator will throw an error describing the invalid configuration. These are also listed below:

- Identity Verification Enabled **must** be set to `false` when the Token Authentication mechanism is set to `client_secret_post`.

#### Simulating key rotation:

The simulator supports publishing multiple ID token signing keys. This can be used to test how your application handles ID token key rotation. Documentation on key rotation can be found [here](./key-rotation.md).

#### JWKS configuration

The simulator supports using a JWKS endpoint to retrieve public signing keys, instead of defining a public key in the config. Documentation on how to use this can be found [here](./jwks.md)
