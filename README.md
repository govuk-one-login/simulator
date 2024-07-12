# GOV.UK One Login Simulator

## Local Setup

To run the stub locally, you can simply run `docker compose up --build`.
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
The parameters to be set can be found in `src/config.ts`. The private key for the default public key is:

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
