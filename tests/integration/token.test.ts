import {
  errors,
  exportSPKI,
  importPKCS8,
  JWTPayload,
  jwtVerify,
  SignJWT,
  UnsecuredJWT,
} from "jose";
import { createApp } from "../../src/app";
import request from "supertest";
import { generateKeyPairSync, randomBytes, randomUUID } from "crypto";
import { Config } from "../../src/config";
import AuthRequestParameters from "../../src/types/auth-request-parameters";
import {
  EC_KEY_ID,
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
  INVALID_ISSUER,
  RSA_KEY_ID,
  SESSION_ID,
  TRUSTMARK_URL,
  VALID_CLAIMS,
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
const knownAuthCode = "aac8964a69b2c7c56c3bfcf108248fe1";
const redirectUriMismatchCode = "5c255ea25c063a83a5f02242103bdc9f";
const nonce = "bf05c36da9122a7378439924c011c51c";
const scopes = ["openid"];

const validAuthRequestParams: AuthRequestParameters = {
  nonce,
  redirectUri: redirectUri,
  scopes,
  claims: VALID_CLAIMS,
  vtr: {
    credentialTrust: "Cl.Cm",
    levelOfConfidence: "P2",
  },
};
const redirectUriMismatchParams: AuthRequestParameters = {
  nonce,
  redirectUri: "https://example.com/authentication-callback-invalid/",
  scopes,
  claims: [],
  vtr: {
    credentialTrust: "Cl.Cm",
    levelOfConfidence: null,
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
  signingAlgorithm: "ES256" | "RS256",
  errors: string[] = []
) => {
  process.env.CLIENT_ID = clientId;
  process.env.REDIRECT_URLS = redirectUri;
  process.env.SUB = knownSub;
  process.env.ID_TOKEN_ERRORS = errors.join(",");
  process.env.CLAIMS = VALID_CLAIMS.join(",");
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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
    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

    const app = createApp();
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

describe("/token endpoint, configured error responses", () => {
  jest.spyOn(Config.getInstance(), "getIdTokenErrors");
  let validRequest: Record<string, string>;

  beforeEach(async () => {
    validRequest = {
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: await createValidClientAssertion(
        {
          iss: knownClientId,
          sub: knownClientId,
          aud: EXPECTED_PRIVATE_KEY_JWT_AUDIENCE,
          jti: randomUUID(),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        "ES256"
      ),
    };
  });

  it("returns an invalid header if the client config has enabled INVALID_ALG_HEADER", async () => {
    await setupClientConfig(knownClientId, "ES256", ["INVALID_ALG_HEADER"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    expect(response.status).toBe(200);
    const { id_token } = response.body;
    const header = decodeTokenPart(id_token.split(".")[0]);
    expect(header).toStrictEqual({
      alg: "HS256",
    });
  });

  it("returns an invalid signature if the client config has enabled INVALID_SIGNATURE", async () => {
    await setupClientConfig(knownClientId, "ES256", ["INVALID_SIGNATURE"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const ecKey = await importPKCS8(EC_PRIVATE_TOKEN_SIGNING_KEY, "ES256");
    await expect(jwtVerify(id_token, ecKey)).rejects.toThrow(
      errors.JWSSignatureVerificationFailed
    );
  });

  it("returns an invalid vot if the client config has enabled INCORRECT_VOT", async () => {
    await setupClientConfig(knownClientId, "ES256", ["INCORRECT_VOT"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.vot).not.toEqual(validAuthRequestParams.vtr.credentialTrust);
    expect(payload.vot).toBe("Cl");
  });

  it("returns an invalid iat in the future if the client config has enabled TOKEN_NOT_VALID_YET", async () => {
    await setupClientConfig(knownClientId, "ES256", ["TOKEN_NOT_VALID_YET"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.iat).toBeGreaterThan(Date.now() / 1000);
  });

  it("returns an expired token if the client config has enabled TOKEN_EXPIRED", async () => {
    await setupClientConfig(knownClientId, "ES256", ["TOKEN_EXPIRED"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.iat).toBeLessThan(Date.now() / 1000);
  });

  it("returns an invalid aud if the client config has enabled INVALID_AUD", async () => {
    await setupClientConfig(knownClientId, "ES256", ["INVALID_AUD"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.aud).not.toBe(knownClientId);
  });

  it("returns an invalid iss if the client config has enabled INVALID_ISS", async () => {
    await setupClientConfig(knownClientId, "ES256", ["INVALID_ISS"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.iss).not.toBe("http://host.docker.internal:3000/");
    expect(payload.iss).toBe(INVALID_ISSUER);
  });

  it("returns an invalid nonce if the client config has enabled NONCE_NOT_MATCHING", async () => {
    await setupClientConfig(knownClientId, "ES256", ["NONCE_NOT_MATCHING"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const payload = decodeTokenPart(id_token.split(".")[1]);
    expect(payload.nonce).not.toBe(validAuthRequestParams.nonce);
  });
});

describe("/token endpoint valid client_assertion", () => {
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

    const app = createApp();
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

    const app = createApp();
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

  test.each<{
    tokenSigningAlgorithm: "RS256" | "ES256";
    expectedKeyId: string;
  }>([
    {
      tokenSigningAlgorithm: "RS256",
      expectedKeyId: RSA_KEY_ID,
    },
    {
      tokenSigningAlgorithm: "ES256",
      expectedKeyId: EC_KEY_ID,
    },
  ])(
    "returns a valid access_token and id_token for a valid token request with a $tokenSigningAlgorithm signed client assertion",
    async ({ tokenSigningAlgorithm, expectedKeyId }) => {
      await setupClientConfig(knownClientId, tokenSigningAlgorithm);
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
        tokenSigningAlgorithm
      );

      const app = createApp();
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
        alg: tokenSigningAlgorithm,
        kid: expectedKeyId,
      });
      expect(decodedAccessToken.sub).toBe(knownSub);
      expect(decodedAccessToken.client_id).toBe(knownClientId);
      expect(decodedAccessToken.sid).toBe(SESSION_ID);
      expect(decodedAccessToken.scope).toStrictEqual(
        validAuthRequestParams.scopes
      );
      expect(decodedAccessToken.claims).toEqual(VALID_CLAIMS);
      expect(decodeTokenPart(idTokenHeader)).toStrictEqual({
        alg: tokenSigningAlgorithm,
        kid: expectedKeyId,
      });
      expect(decodedIdToken.sub).toBe(knownSub);
      expect(decodedIdToken.vtm).toBe(TRUSTMARK_URL);
      expect(decodedIdToken.iss).toBe("http://host.docker.internal:3000/");
      expect(decodedIdToken.aud).toBe(knownClientId);
      expect(decodedIdToken.sid).toBe(SESSION_ID);
      expect(decodedIdToken.nonce).toBe(validAuthRequestParams.nonce);
      expect(decodedIdToken.vot).toBe(
        validAuthRequestParams.vtr.credentialTrust
      );
    }
  );
});
