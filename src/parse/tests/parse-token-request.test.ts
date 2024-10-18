import { exportSPKI, SignJWT } from "jose";
import { Config } from "../../config";
import { ParseTokenRequestError } from "../../errors/parse-token-request-error";
import { TokenRequestError } from "../../errors/token-request-error";
import { parseTokenRequest } from "../parse-token-request";
import { generateKeyPairSync, randomUUID } from "crypto";
import { logger } from "../../logger";

const fakeClientAssertion = (
  header: Record<string, string>,
  payload: Record<string, unknown> | string,
  signature = "r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI"
) =>
  Buffer.from(JSON.stringify(header)).toString("base64url") +
  "." +
  Buffer.from(JSON.stringify(payload)).toString("base64url") +
  "." +
  signature;

const config = Config.getInstance();
const publicKeySpy = jest.spyOn(config, "getPublicKey");
const idTokenSigningSpy = jest.spyOn(config, "getIdTokenSigningAlgorithm");
const clientIdSpy = jest.spyOn(config, "getClientId");
const infoLoggerSpy = jest.spyOn(logger, "info");

const rsaKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const testTimestamp = 1723707024;
const knownClientId = "b1a80190cf07983fca7e46375385a8ed";
const audience = "http://localhost:3000/token";

describe("parseTokenRequest tests", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(testTimestamp);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws an invalid_request error for no grant_type", async () => {
    await expect(
      parseTokenRequest(
        {
          code: "1234",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing grant_type parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the grant_type is not authorization_code", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "not_authorization_code",
          code: "1234",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "unsupported_grant_type",
        errorDescription: "Unsupported grant type",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when no redirect_uri is included", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "1234",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing redirect_uri parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when no code is included", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing code parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_assertion_type is not included", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_assertion is not included", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid when the client_assertion_type is not urn:ietf:params:oauth:client-assertion-type:jwt-bearer", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:some-other-assertion",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid private_key_jwt",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an ParseTokenRequestError for an invalid JWS in the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: "some.invalid.jws.with.too.many.parts",
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Unexpected number of Base64URL parts, must be three"
      )
    );
  });

  it("throws an ParseTokenRequestError if the payload is invalid JSON", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            "NotValidJson"
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Payload of JWS object is not a valid JSON object"
      )
    );
  });

  it("throws an ParseTokenRequestError if the signature is empty", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            },
            "             "
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " + "The signature must not be empty"
      )
    );
  });

  it("throws an ParseTokenRequestError if there is no sub claim in the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Missing subject in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if there is no issuer in the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Missing issuer in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if there is no aud in the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Missing audience in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if there is no exp in the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Missing or invalid expiry in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if the exp is invalid the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              aud: audience,
              exp: "notANumber",
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Missing or invalid expiry in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if the nbf claim is invalid the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              aud: audience,
              exp: 12345678,
              nbf: "notANumber",
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Invalid nbf claim in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if the nbf claim is invalid the client_assertion", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              aud: audience,
              exp: 12345678,
              iat: "notANumber",
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "Invalid iat claim in client JWT assertion"
      )
    );
  });

  it("throws an ParseTokenRequestError if there is no alg in the header", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {},
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "The client assertion JWT must be RSA or ECDSA-signed (RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 or ES512)"
      )
    );
  });

  it("throws an ParseTokenRequestError if the alg in the header is not RS256 or ES256", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: fakeClientAssertion(
            {
              alg: "HS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "The client assertion JWT must be RSA or ECDSA-signed (RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 or ES512)"
      )
    );
  });

  it("throws an error if the token request includes a top-level client_id which does not match the sub in the client_assertion", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_id: "someInvalidClient",

          client_assertion: fakeClientAssertion(
            {
              alg: "RS256",
            },
            {
              sub: "clientId",
              iss: "clientId",
              jti: "uhedr437r4gbfqq3rd43r",
              exp: 1234567,
              aud: audience,
            }
          ),
        },
        config
      )
    ).rejects.toThrow(
      new ParseTokenRequestError(
        "Invalid client_assertion JWT: " +
          "The client identifier doesn't match the client assertion subject"
      )
    );
  });

  it("throws an invalid_client error if the client_id from the client_assertion does not match the config", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const clientId = "clientId";
    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: clientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: clientId,
      aud: audience,
      jti: randomUUID(),
    };

    const client_assertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion,
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Client authentication failed",
        httpStatusCode: 401,
      })
    );
  });

  it("throws an invalid_grant error for an expired client_assertion", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) - 3600,
      iss: knownClientId,
      aud: audience,
      jti: randomUUID(),
    };

    const clientAssertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: clientAssertion,
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_grant",
        errorDescription: "private_key_jwt has expired",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client error if the client_assertion aud is not the expected token endpoint", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: knownClientId,
      aud: "https://identity-provider.example.com/token",
      jti: randomUUID(),
    };

    const client_assertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion,
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Invalid signature in private_key_jwt",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client error if the client_assertion iss and sub claims do not match", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: "notTheSameClientId",
      aud: audience,
      jti: randomUUID(),
    };

    const client_assertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion,
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Invalid signature in private_key_jwt",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client signature error if the signature cannot be validated", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: knownClientId,
      aud: audience,
      jti: randomUUID(),
    };

    const clientAssertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    const clientAssertionInvalid = clientAssertion.split(".");

    clientAssertionInvalid[2] = "someInvalidSignature";

    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "123456",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: clientAssertionInvalid.join("."),
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Invalid signature in private_key_jwt",
        httpStatusCode: 400,
      })
    );
  });

  it("returns a parsed tokenRequest and clientAssertion for a valid request", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    publicKeySpy.mockReturnValue(publicKey);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: knownClientId,
      aud: audience,
      jti: randomUUID(),
    };

    const clientAssertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    const tokenRequest = {
      grant_type: "authorization_code",
      code: "123456",
      redirect_uri: "https://example.com/authentication-callback/",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
    };

    const parsedTokenRequest = await parseTokenRequest(tokenRequest, config);

    expect(parsedTokenRequest).toStrictEqual({
      tokenRequest: {
        grant_type: "authorization_code",
        code: "123456",
        redirectUri: "https://example.com/authentication-callback/",
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: clientAssertion,
      },
      clientAssertion: {
        header,
        payload,
        token: clientAssertion,
        clientId: knownClientId,
        signature: clientAssertion.split(".")[2],
      },
    });
  });

  it("returns a parsed tokenRequest and clientAssertion for a valid request when no affixes on public key", async () => {
    clientIdSpy.mockReturnValue(knownClientId);
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    const publicKeyMissingAffexes = publicKey
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "");
    publicKeySpy.mockReturnValue(publicKeyMissingAffexes);
    idTokenSigningSpy.mockReturnValue("RS256");

    const header = {
      alg: "RS256",
    };
    const payload = {
      sub: knownClientId,
      exp: Math.floor(testTimestamp / 1000) + 300,
      iss: knownClientId,
      aud: audience,
      jti: randomUUID(),
    };

    const clientAssertion = await new SignJWT(payload)
      .setProtectedHeader(header)
      .sign(rsaKeyPair.privateKey);

    const tokenRequest = {
      grant_type: "authorization_code",
      code: "123456",
      redirect_uri: "https://example.com/authentication-callback/",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: clientAssertion,
    };

    const parsedTokenRequest = await parseTokenRequest(tokenRequest, config);

    expect(parsedTokenRequest).toStrictEqual({
      tokenRequest: {
        grant_type: "authorization_code",
        code: "123456",
        redirectUri: "https://example.com/authentication-callback/",
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: clientAssertion,
      },
      clientAssertion: {
        header,
        payload,
        token: clientAssertion,
        clientId: knownClientId,
        signature: clientAssertion.split(".")[2],
      },
    });
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Public key does not have expected prefix. Adding prefix."
    );
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      "Public key does not have expected suffix. Adding suffix."
    );
  });
});
