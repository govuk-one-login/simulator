import { exportSPKI, JWTPayload, SignJWT, UnsecuredJWT } from "jose";
import { createApp } from "../../src/app";
import request from "supertest";
import { generateKeyPairSync, randomBytes, randomUUID } from "crypto";
import { Config } from "../../src/config";
import AuthRequestParameters from "../../src/types/auth-request-parameters";
import {
  EC_KEY_ID,
  EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
  ISSUER_VALUE,
  RSA_KEY_ID,
  SESSION_ID,
  TRUSTMARK_URL,
} from "../../src/constants";

const TOKEN_ENDPOINT = "/token";

const ecKeyPair = generateKeyPairSync("ec", {
  namedCurve: "P-256",
});

const decodeTokenPart = (part: string): Record<string, string> =>
  JSON.parse(Buffer.from(part, "base64url").toString());

const rsaKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const knownClientId = "d76db56760ceda7cab875f085c54bd35";
const redirectUri = "https://localhost:3000/authentication-callback";
const knownSub = "urn:fdc:gov.uk:2022:9e374b47c4ef6de6551be5f28d97f9dd";

const createClientAssertionPayload = (
  payload: Record<string, unknown>,
  isExpired = false
) =>
  new UnsecuredJWT(payload)
    .setIssuedAt(Math.floor(Date.now() / 1000))
    .setExpirationTime(isExpired ? "-1h" : "1h")
    .setJti(randomUUID())
    .setAudience(EXPECTED_PRIVATE_KEY_JWT_AUDIENCE)
    .encode()
    .split(".")[1];

const createClientAssertionHeader = (signingAlgorithm: string) =>
  Buffer.from(JSON.stringify({ alg: signingAlgorithm })).toString("base64url");

const fakeSignature = () => randomBytes(16).toString("hex");

const setupClientConfig = async (
  clientId: string,
  signingAlgorithm: "ES256" | "RS256"
) => {
  process.env.CLIENT_ID = clientId;
  process.env.REDIRECT_URLS = redirectUri;
  process.env.SUB = knownSub;
  if (signingAlgorithm === "ES256") {
    const publicKey = await exportSPKI(ecKeyPair.publicKey);
    process.env.PUBLIC_KEY = publicKey;
    process.env.ID_TOKEN_SIGNING_ALGORITHM = signingAlgorithm;
  } else if (signingAlgorithm === "RS256") {
    const publicKey = await exportSPKI(rsaKeyPair.publicKey);
    process.env.PUBLIC_KEY = publicKey;
    process.env.ID_TOKEN_SIGNING_ALGORITHM = signingAlgorithm;
  }
  Config.resetInstance();
};

describe("/token endpoint tests, invalid request", () => {
  it("returns an invalid_request error for missing grant_type", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      code: "123456",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Request is missing grant_type parameter",
    });
  });

  it("returns an invalid_request error when grant_type is not authorization_code", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "not_authorization_code",
      code: "123456",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "unsupported_grant_type",
      error_description: "Unsupported grant type",
    });
  });

  it("returns an invalid_request no redirect_uri is included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Request is missing redirect_uri parameter",
    });
  });

  it("returns an invalid_request when no auth_code is included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Request is missing code parameter",
    });
  });

  it("returns an invalid_request when the client_assertion_type is not included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid token authentication method used",
    });
  });

  it("returns an invalid_request when the client_assertion is not included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid token authentication method used",
    });
  });

  it("returns an invalid_request when the client_assertion is not included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid token authentication method used",
    });
  });

  it("returns an invalid_request when the client_assertion_type is not included", async () => {
    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer-invalid",
      redirect_uri: "http://localhost:8080/authorization-code/callback",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid private_key_jwt",
    });
  });
});

describe("/token endpoint tests, invalid client assertion", () => {
  it("returns an invalid_request if client_assertion is missing iss", async () => {
    await setupClientConfig(knownClientId, "ES256");

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload({
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid private_key_jwt",
    });
  });

  it("returns an invalid_request if client_assertion is missing sub", async () => {
    await setupClientConfig(knownClientId, "ES256");

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid private_key_jwt",
    });
  });

  it("returns an invalid_request if signing alg in header is not ES256 or RS256", async () => {
    await setupClientConfig(knownClientId, "ES256");

    const clientAssertion =
      createClientAssertionHeader("HS256") +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid private_key_jwt",
    });
  });

  it("returns an invalid_client for an unknown client_id", async () => {
    await setupClientConfig(randomUUID(), "ES256");

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload({
        sub: knownClientId,
        iss: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(401);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Client authentication failed",
    });
  });

  it("returns an invalid_grant for an expired client assertion ", async () => {
    await setupClientConfig(knownClientId, "ES256");

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload(
        {
          iss: knownClientId,
          sub: knownClientId,
          aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
        },
        true
      ) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "private_key_jwt has expired",
    });
  });

  it("returns an invalid_client for an invalid signature", async () => {
    await setupClientConfig(knownClientId, "ES256");

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Invalid signature in private_key_jwt",
    });
  });

  it("returns an invalid signature for an unknown audience in client_assertion", async () => {
    await setupClientConfig(knownClientId, "ES256");

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(undefined);

    const clientAssertion =
      createClientAssertionHeader("ES256") +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: "https://identity-provider.example.com/token",
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }) +
      "." +
      fakeSignature();

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: randomUUID(),
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Invalid signature in private_key_jwt",
    });
  });
});

describe("/token endpoint valid client_assertion", () => {
  const knownAuthCode = "aac8964a69b2c7c56c3bfcf108248fe1";
  const redirectUriMismatchCode = "5c255ea25c063a83a5f02242103bdc9f";
  const nonce = "bf05c36da9122a7378439924c011c51c";
  const scopes = ["openid"];

  const validAuthRequestParams: AuthRequestParameters = {
    nonce,
    redirectUri: redirectUri,
    scopes,
    claims: [],
    vtr: {
      credentialTrust: "Cl.Cm",
    },
  };
  const redirectUriMismatchParams: AuthRequestParameters = {
    nonce,
    redirectUri: "https://example.com/authentication-callback-invalid/",
    scopes,
    claims: [],
    vtr: {
      credentialTrust: "Cl.Cm",
    },
  };

  const createValidClientAssertion = async (
    payload: JWTPayload,
    idTokenSigningAlgorithm: "ES256" | "RS256"
  ): Promise<string> => {
    if (idTokenSigningAlgorithm === "ES256") {
      return await new SignJWT(payload)
        .setProtectedHeader({
          alg: idTokenSigningAlgorithm,
        })
        .sign(ecKeyPair.privateKey);
    } else
      return await new SignJWT(payload)
        .setProtectedHeader({
          alg: idTokenSigningAlgorithm,
        })
        .sign(rsaKeyPair.privateKey);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an invalid_grant error when there are no auth request params for auth code", async () => {
    await setupClientConfig(knownClientId, "ES256");

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(undefined);

    const clientAssertion = await createValidClientAssertion(
      {
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ES256"
    );

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: randomUUID(),
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "Invalid grant",
    });
  });

  it("returns an invalid_grant error if the request redirect uri does not match the auth code params", async () => {
    await setupClientConfig(knownClientId, "ES256");
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(redirectUriMismatchParams);

    const clientAssertion = await createValidClientAssertion(
      {
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ES256"
    );

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: redirectUriMismatchCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });
    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "Invalid grant",
    });
  });

  it("returns a valid access_token and id_token for a valid token request with a ES256 signed client assertion", async () => {
    await setupClientConfig(knownClientId, "ES256");
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const clientAssertion = await createValidClientAssertion(
      {
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "ES256"
    );

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });

    expect(response.status).toEqual(200);

    const { access_token, expires_in, id_token, token_type } = response.body;

    const [accessTokenHeader, accessTokenPayload] = access_token.split(".");
    const [idTokenHeader, idTokenPayload] = id_token.split(".");

    const decodedAccessToken = decodeTokenPart(accessTokenPayload);
    const decodedIdToken = decodeTokenPart(idTokenPayload);

    expect(expires_in).toEqual(3600);
    expect(token_type).toEqual("Bearer");

    expect(decodeTokenPart(accessTokenHeader)).toStrictEqual({
      alg: "ES256",
      kid: EC_KEY_ID,
    });
    expect(decodedAccessToken.sub).toBe(knownSub);
    expect(decodedAccessToken.client_id).toBe(knownClientId);
    expect(decodedAccessToken.sid).toBe(SESSION_ID);
    expect(decodedAccessToken.scope).toStrictEqual(
      validAuthRequestParams.scopes
    );

    expect(decodeTokenPart(idTokenHeader)).toStrictEqual({
      alg: "ES256",
      kid: EC_KEY_ID,
    });
    expect(decodedIdToken.sub).toBe(knownSub);
    expect(decodedIdToken.iss).toBe(ISSUER_VALUE);
    expect(decodedIdToken.vtm).toBe(TRUSTMARK_URL);
    expect(decodedIdToken.aud).toBe(knownClientId);
    expect(decodedIdToken.sid).toBe(SESSION_ID);
    expect(decodedIdToken.nonce).toBe(validAuthRequestParams.nonce);
    expect(decodedIdToken.vot).toBe(validAuthRequestParams.vtr.credentialTrust);
  });

  it("returns a valid access_token and id_token for a valid token request with a RS256 signed client assertion", async () => {
    await setupClientConfig(knownClientId, "RS256");
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const clientAssertion = await createValidClientAssertion(
      {
        iss: knownClientId,
        sub: knownClientId,
        aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      "RS256"
    );

    const app = await createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });

    expect(response.status).toEqual(200);

    const { access_token, expires_in, id_token, token_type } = response.body;

    const [accessTokenHeader] = access_token.split(".");
    const [idTokenHeader] = id_token.split(".");

    expect(expires_in).toEqual(3600);
    expect(token_type).toEqual("Bearer");

    expect(decodeTokenPart(accessTokenHeader)).toStrictEqual({
      alg: "RS256",
      kid: RSA_KEY_ID,
    });

    expect(decodeTokenPart(idTokenHeader)).toStrictEqual({
      alg: "RS256",
      kid: RSA_KEY_ID,
    });
  });
});
