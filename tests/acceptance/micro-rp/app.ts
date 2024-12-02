import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import { importPKCS8, SignJWT } from "jose";

const app = express();
const port = 3001;
const simulatorUrl = "http://localhost:3000";
const clientId = "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw";

app.get("/callback", async (req: Request, res: Response) => {
  const tokenResponse = await makeTokenRequest(req.query["code"] as string);
  const userInfoResponse = await makeUserInfoRequest(
    tokenResponse["access_token"]
  );
  res.send(userInfoResponse);
});

app.listen(port);

const makeTokenRequest = async (code: string): Promise<TokenResponse> => {
  const privateKey = `-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----`;
  const tokenUri = `${simulatorUrl}/token`;
  const claims = {
    aud: tokenUri,
    iss: clientId,
    sub: clientId,
    exp: Date.now() / 1000 + 5 * 60,
    iat: Date.now() / 1000,
    jti: randomUUID(),
  };
  const tokenSigningKey = await importPKCS8(privateKey, "RSA");
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({
      alg: "RS256",
    })
    .sign(tokenSigningKey);
  const body = {
    code: code,
    redirect_uri: "http://localhost:3001/callback",
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: jwt,
    grant_type: "authorization_code",
  };
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return response.json();
};

const makeUserInfoRequest = async (accessToken: string) => {
  const userInfoResponse = await fetch(`${simulatorUrl}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return userInfoResponse.json();
};

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token: string;
}
