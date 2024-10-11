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

## Configuration
Client configuration and configuration for the response can be set as environment variables, however there are also default values set.
Parameters that are parsed as an array should be set as a comma separated string, for example
```
CLIENT_LOCS=P0,P2
```
The parameters to be set can be found in `src/config.ts`. The private key for the default public key is:

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

### Error configuration:

You can setup the simulator to return specific error scenarios for the Core Identity JWT and ID Token issued. Multiple error states can be enabled and these should be passed to the following environment variables as a comma separated string:


> `AUTHORISE_ERRORS` - These will enable an error response from the `/authorize` endpoint and can have the following valid values:
>
> > - "ACCESS_DENIED": This error will return an `access_denied` response for all valid requests to the `/authorize` endpoint when enabled.

> `ID_TOKEN_ERRORS` - This enables invalid ID Tokens to be issued by the simulator and has the following valid values:
>
> > - "INVALID_ISS"
> > - "INVALID_AUD"
> > - "INVALID_ALG_HEADER"
> > - "INVALID_SIGNATURE"
> > - "TOKEN_EXPIRED"
> > - "TOKEN_NOT_VALID_YET"
> > - "NONCE_NOT_MATCHING"
> > - "INCORRECT_VOT"

> `CORE_IDENTITY_ERRORS` - This enables invalid ID Tokens to be issued by the simulator and has the following valid values:
>
> > - "INVALID_ALG_HEADER"
> > - "INVALID_SIGNATURE"
> > - "INVALID_ISS"
> > - "INVALID_AUD"
> > - "INCORRECT_SUB"
> > - "TOKEN_EXPIRED"

You can also setup these error scenarios using the `/config` endpoint by making a POST request with a body similar to the one below:

```json
{
    "errorConfiguration":{
        "coreIdentityErrors": ["INVALID_ALG_HEADER"], 
        "idTokenErrors": ["INVALID_ISS"]
    }
}
```
To remove an error configuration, you can either unset the environment variables mentioned above, or you can POST the config endpoint **without** the `errorConfiguration` field in the body. 

> [!NOTE]  
> Anytime you update your configuration using the `/config` endpoint you **must** include the errorConfiguration if you wish to maintain the configured errors