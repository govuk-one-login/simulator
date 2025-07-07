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
| TEMPORARILY_UNAVAILABLE | Returns the temporarily unavailable error that would be returned to an RP when an RP is being rate limited. It is returned just after the authorisation request is validated |

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
