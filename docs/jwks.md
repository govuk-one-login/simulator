## JWKS support

The simulator supports reading public signing keys from a JWKS endpoint. 

This can be enabled by: 
- Sending a POST request to the `/config` endpoint with the fields:
    - `publicKeySource` set to `JWKS`
    - `jwksUrl` set to the URL of a valid JWKS endpoint
- Or setting the following environment variables:
    - `PUBLIC_KEY_SOURCE` set to `JWKS`
    - `JWKS_URL` set to the URL of a valid JWKS endpoint

Once these values are set, instead of using a public key defined in the simulator, the simulator will look for the correct key on the JWKS endpoint to use in signature validation.

Note that you must to provide a `kid` in the header of the request that you are sending, and a key with that `kid` needs to exist on the JWKS endpoint, else the simulator will return an error.

You also need to set the JWKS URL if you have set the `publicKeySource` to `JWKS`, else the simulator will return an error.
