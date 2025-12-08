## Key rotation:

The simulator supports publishing and using multiple ID token signing keys. This can be used to test how your application handles ID token signing key rotation events.

There are two flags which control the publishing and  usage of new ID token signing keys. 

To enable the publishing of new signing keys you can either:

- Send a POST request to the `/config` endpoint with the field `publishNewIdTokenSigningKeys` set to `true`.
- Set the environment variable `PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS` to `true`. 

Once the simulator is publishing new ID token signing keys, you will be able to enable the usage of the new keys. To do this you can either:

- Send a POST request to the `/config` endpoint with the field `useNewIdTokenSigningKeys` set to `true`.
- Set the environment variable `USE_NEW_ID_TOKEN_SIGNING_KEYS` to `true`. 

> [!IMPORTANT]  
> The simulator **must** be set to publish the new ID token signing keys before the usage of the new keys is enabled. If this is not enabled you may receive an error