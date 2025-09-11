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
  INVALID_ISSUER,
  RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
  SESSION_ID,
  VALID_CLAIMS,
  RSA_PRIVATE_TOKEN_SIGNING_KEY,
  ID_TOKEN_EXPIRY,
} from "../../src/constants";
import { decodeJwtNoVerify } from "./helper/decode-jwt-no-verify";
import { exampleResponseConfig } from "./helper/test-constants";
import { INVALID_KEY_KID } from "../../src/components/utils/make-header-invalid";
import { argon2id, hash } from "argon2";

const TOKEN_ENDPOINT = "/token";

const TIME_NOW = 1736789549;
jest.useFakeTimers().setSystemTime(TIME_NOW);

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
const audience = "http://localhost:3000/token";
const issuer = "http://localhost:3000/";

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
  payload: JWTPayload
): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: "RS256",
    })
    .sign(rsaKeyPair.privateKey);
};

const createClientAssertionPayload = (
  payload: Record<string, unknown>,
  isExpired = false
) =>
  new UnsecuredJWT(payload)
    .setIssuedAt(Math.floor(TIME_NOW / 1000))
    .setExpirationTime(isExpired ? "-1h" : "1h")
    .setJti(randomUUID())
    .setAudience(audience)
    .encode()
    .split(".")[1];

const createClientAssertionHeader = (alg?: string) =>
  Buffer.from(JSON.stringify({ alg: alg ?? "RS256" })).toString("base64url");

const fakeSignature = () => randomBytes(16).toString("hex");

const setupClientConfig = async (clientId: string, errors: string[] = []) => {
  process.env.CLIENT_ID = clientId;
  process.env.REDIRECT_URLS = redirectUri;
  process.env.SUB = knownSub;
  process.env.ID_TOKEN_ERRORS = errors.join(",");
  process.env.CLAIMS = VALID_CLAIMS.join(",");
  const publicKey = await exportSPKI(rsaKeyPair.publicKey);
  process.env.PUBLIC_KEY = publicKey;
  process.env.ID_TOKEN_SIGNING_ALGORITHM = "RS256";
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
    await setupClientConfig(knownClientId);

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload({
        sub: knownClientId,
        aud: audience,
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
    await setupClientConfig(knownClientId);

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        aud: audience,
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

  it("returns an invalid_request if signing alg in header is not RS256", async () => {
    await setupClientConfig(knownClientId);

    const clientAssertion =
      createClientAssertionHeader("fake-alg") +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: audience,
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
    await setupClientConfig(randomUUID());

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload({
        sub: knownClientId,
        iss: knownClientId,
        aud: audience,
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
    await setupClientConfig(knownClientId);

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload(
        {
          iss: knownClientId,
          sub: knownClientId,
          aud: audience,
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
    await setupClientConfig(knownClientId);

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: audience,
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
    await setupClientConfig(knownClientId);

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(undefined);

    const clientAssertion =
      createClientAssertionHeader() +
      "." +
      createClientAssertionPayload({
        iss: knownClientId,
        sub: knownClientId,
        aud: "https://identity-provider.example.com/token",
        jti: randomUUID(),
        iat: Math.floor(TIME_NOW / 1000),
        exp: Math.floor(TIME_NOW / 1000) + 3600,
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

describe("/token endpoint tests, invalid client_secret_post", () => {
  beforeEach(() => {
    setupClientConfig(knownClientId);
  });

  afterEach(() => {
    delete process.env.TOKEN_AUTH_METHOD;
    delete process.env.CLIENT_SECRET_HASH;
  });

  it("returns invalid_request for a no client_secret in a client_secret_post request", async () => {
    const app = createApp();

    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_id: knownClientId,
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid token authentication method used",
    });
  });

  it("returns invalid_request for a no client_id in a client_secret_post request", async () => {
    const app = createApp();

    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_secret: "super-secret-secret",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_request",
      error_description: "Invalid token authentication method used",
    });
  });

  it("returns invalid_client for an unknown client_id ", async () => {
    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_secret: "super-secret-secret",
      client_id: "unknown_client_id",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Client authentication failed",
    });
  });

  it("returns invalid_client for a client configured with private_key_jwt ", async () => {
    const app = createApp();

    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_secret: "super-secret-secret",
      client_id: knownClientId,
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Client is not registered to use client_secret_post",
    });
  });

  it("returns invalid_client for a client configured no client secret hash ", async () => {
    process.env.TOKEN_AUTH_METHOD = "client_secret_post";
    Config.resetInstance();

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: "123456",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_secret: "super-secret-secret",
      client_id: knownClientId,
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "No client secret registered",
    });
  });

  it("returns invalid_client for an invalid client_secret provided ", async () => {
    process.env.TOKEN_AUTH_METHOD = "client_secret_post";
    const secret = randomBytes(40).toString("base64");
    const salt = randomBytes(64);
    const hashedSecret = await hash(secret, {
      salt,
      memoryCost: 15360,
      parallelism: 1,
      hashLength: 16,
      timeCost: 2,
      type: argon2id,
    });
    process.env.CLIENT_SECRET_HASH = hashedSecret;
    Config.resetInstance();

    const app = createApp();
    const response = await request(app)
      .post(TOKEN_ENDPOINT)
      .send({
        grant_type: "authorization_code",
        code: "123456",
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        redirect_uri: redirectUri,
        client_secret: randomBytes(40).toString("base64"),
        client_id: knownClientId,
      });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_client",
      error_description: "Invalid client secret",
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
      client_assertion: await createValidClientAssertion({
        iss: knownClientId,
        sub: knownClientId,
        aud: audience,
        jti: randomUUID(),
        iat: Math.floor(TIME_NOW / 1000),
        exp: Math.floor(TIME_NOW / 1000) + 3600,
      }),
    };
  });

  it("returns an invalid header if the client config has enabled INVALID_ALG_HEADER", async () => {
    await setupClientConfig(knownClientId, ["INVALID_ALG_HEADER"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    expect(response.status).toBe(200);
    const { id_token } = response.body;
    const { protectedHeader } = decodeJwtNoVerify(id_token);
    expect(protectedHeader).toStrictEqual({
      kid: INVALID_KEY_KID,
      alg: "HS256",
    });
  });

  it("returns an invalid signature if the client config has enabled INVALID_SIGNATURE", async () => {
    await setupClientConfig(knownClientId, ["INVALID_SIGNATURE"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const rsaKey = await importPKCS8(RSA_PRIVATE_TOKEN_SIGNING_KEY, "RS256");
    await expect(jwtVerify(id_token, rsaKey)).rejects.toThrow(
      errors.JWSSignatureVerificationFailed
    );
  });

  it("returns an invalid vot if the client config has enabled INCORRECT_VOT", async () => {
    await setupClientConfig(knownClientId, ["INCORRECT_VOT"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.vot).not.toEqual(validAuthRequestParams.vtr.credentialTrust);
    expect(payload.vot).toBe("Cl");
  });

  it("returns an invalid iat in the future if the client config has enabled TOKEN_NOT_VALID_YET", async () => {
    await setupClientConfig(knownClientId, ["TOKEN_NOT_VALID_YET"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.iat).toBe(Math.floor(TIME_NOW / 1000) + 86400);
  });

  it("returns an expired token if the client config has enabled TOKEN_EXPIRED", async () => {
    await setupClientConfig(knownClientId, ["TOKEN_EXPIRED"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.iat).toBe(Math.floor(TIME_NOW / 1000));
  });

  it("returns an invalid aud if the client config has enabled INVALID_AUD", async () => {
    await setupClientConfig(knownClientId, ["INVALID_AUD"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.aud).not.toBe(knownClientId);
  });

  it("returns an invalid iss if the client config has enabled INVALID_ISS", async () => {
    await setupClientConfig(knownClientId, ["INVALID_ISS"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.iss).not.toBe("http://localhost:3000/");
    expect(payload.iss).toBe(INVALID_ISSUER);
  });

  it("returns an invalid nonce if the client config has enabled NONCE_NOT_MATCHING", async () => {
    await setupClientConfig(knownClientId, ["NONCE_NOT_MATCHING"]);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send(validRequest);
    const { id_token } = response.body;
    const { payload } = decodeJwtNoVerify(id_token);
    expect(payload.nonce).not.toBe(validAuthRequestParams.nonce);
  });
});

describe("/token endpoint valid client_assertion", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns an invalid_grant error when there are no auth request params for auth code", async () => {
    await setupClientConfig(knownClientId);

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(undefined);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

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
    await setupClientConfig(knownClientId);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(redirectUriMismatchParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

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

  test("returns a valid access_token and id_token for a valid token request with a $tokenSigningAlgorithm signed client assertion", async () => {
    await setupClientConfig(knownClientId);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

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

    const decodedAccessToken = decodeJwtNoVerify(access_token);
    const decodedIdToken = decodeJwtNoVerify(id_token);

    expect(expires_in).toEqual(180);
    expect(token_type).toEqual("Bearer");

    expect(decodedAccessToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedAccessToken.payload.sub).toBe(knownSub);
    expect(decodedAccessToken.payload.client_id).toBe(knownClientId);
    expect(decodedAccessToken.payload.sid).toBe(SESSION_ID);
    expect(decodedAccessToken.payload.scope).toStrictEqual(
      validAuthRequestParams.scopes
    );
    expect(decodedAccessToken.payload.claims).toEqual(VALID_CLAIMS);
    expect(decodedIdToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedIdToken.payload.sub).toBe(knownSub);
    expect(decodedIdToken.payload.iss).toBe("http://localhost:3000/");
    expect(decodedIdToken.payload.vtm).toBe("http://localhost:3000/trustmark");
    expect(decodedIdToken.payload.aud).toBe(knownClientId);
    expect(decodedIdToken.payload.sid).toBe(SESSION_ID);
    expect(decodedIdToken.payload.nonce).toBe(validAuthRequestParams.nonce);
    expect(decodedIdToken.payload.vot).toBe(
      validAuthRequestParams.vtr.credentialTrust
    );
    expect(decodedIdToken.payload.iat).toBe(Math.floor(TIME_NOW / 1000));
    expect(decodedIdToken.payload.exp).toBe(
      Math.floor(TIME_NOW / 1000) + ID_TOKEN_EXPIRY
    );
    expect(decodedIdToken.payload.auth_time).toBe(Math.floor(TIME_NOW / 1000));
  });

  test("returns a valid access_token and id_token for a valid token request with the issuer as the client assertion audience", async () => {
    await setupClientConfig(knownClientId);
    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: issuer,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

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

    const decodedAccessToken = decodeJwtNoVerify(access_token);
    const decodedIdToken = decodeJwtNoVerify(id_token);

    expect(expires_in).toEqual(180);
    expect(token_type).toEqual("Bearer");

    expect(decodedAccessToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedAccessToken.payload.sub).toBe(knownSub);
    expect(decodedAccessToken.payload.client_id).toBe(knownClientId);
    expect(decodedAccessToken.payload.sid).toBe(SESSION_ID);
    expect(decodedAccessToken.payload.scope).toStrictEqual(
      validAuthRequestParams.scopes
    );
    expect(decodedAccessToken.payload.claims).toEqual(VALID_CLAIMS);
    expect(decodedIdToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedIdToken.payload.sub).toBe(knownSub);
    expect(decodedIdToken.payload.iss).toBe("http://localhost:3000/");
    expect(decodedIdToken.payload.vtm).toBe("http://localhost:3000/trustmark");
    expect(decodedIdToken.payload.aud).toBe(knownClientId);
    expect(decodedIdToken.payload.sid).toBe(SESSION_ID);
    expect(decodedIdToken.payload.nonce).toBe(validAuthRequestParams.nonce);
    expect(decodedIdToken.payload.vot).toBe(
      validAuthRequestParams.vtr.credentialTrust
    );
    expect(decodedIdToken.payload.iat).toBe(Math.floor(TIME_NOW / 1000));
    expect(decodedIdToken.payload.exp).toBe(
      Math.floor(TIME_NOW / 1000) + ID_TOKEN_EXPIRY
    );
    expect(decodedIdToken.payload.auth_time).toBe(Math.floor(TIME_NOW / 1000));
  });
});

describe("/token endpoint tests, valid client_secret_post", () => {
  beforeEach(() => {
    setupClientConfig(knownClientId);
  });

  afterEach(() => {
    delete process.env.TOKEN_AUTH_METHOD;
    delete process.env.CLIENT_SECRET_HASH;
  });

  it("returns valid tokens for a valid client_secret request ", async () => {
    process.env.TOKEN_AUTH_METHOD = "client_secret_post";
    const secret = randomBytes(40).toString("base64");
    const salt = randomBytes(64);
    const hashedSecret = await hash(secret, {
      salt,
      memoryCost: 15360,
      parallelism: 1,
      hashLength: 16,
      timeCost: 2,
      type: argon2id,
    });
    process.env.CLIENT_SECRET_HASH = hashedSecret;
    Config.resetInstance();

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_secret: secret,
      client_id: knownClientId,
    });

    expect(response.status).toEqual(200);

    const { access_token, expires_in, id_token, token_type } = response.body;

    const decodedAccessToken = decodeJwtNoVerify(access_token);
    const decodedIdToken = decodeJwtNoVerify(id_token);

    expect(expires_in).toEqual(180);
    expect(token_type).toEqual("Bearer");

    expect(decodedAccessToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedAccessToken.payload.sub).toBe(knownSub);
    expect(decodedAccessToken.payload.client_id).toBe(knownClientId);
    expect(decodedAccessToken.payload.sid).toBe(SESSION_ID);
    expect(decodedAccessToken.payload.scope).toStrictEqual(
      validAuthRequestParams.scopes
    );
    expect(decodedAccessToken.payload.claims).toEqual(VALID_CLAIMS);
    expect(decodedIdToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedIdToken.payload.sub).toBe(knownSub);
    expect(decodedIdToken.payload.iss).toBe("http://localhost:3000/");
    expect(decodedIdToken.payload.vtm).toBe("http://localhost:3000/trustmark");
    expect(decodedIdToken.payload.aud).toBe(knownClientId);
    expect(decodedIdToken.payload.sid).toBe(SESSION_ID);
    expect(decodedIdToken.payload.nonce).toBe(validAuthRequestParams.nonce);
    expect(decodedIdToken.payload.vot).toBe(
      validAuthRequestParams.vtr.credentialTrust
    );
    expect(decodedIdToken.payload.iat).toBe(Math.floor(TIME_NOW / 1000));
    expect(decodedIdToken.payload.exp).toBe(
      Math.floor(TIME_NOW / 1000) + ID_TOKEN_EXPIRY
    );
    expect(decodedIdToken.payload.auth_time).toBe(Math.floor(TIME_NOW / 1000));
  });
});

describe('when INTERACTIVE_MODE is set to "true"', () => {
  beforeAll(() => {
    process.env.INTERACTIVE_MODE = "true";
  });

  afterAll(() => {
    delete process.env.INTERACTIVE_MODE;
  });

  it("returns a valid access_token and id_token and stores the response configuration", async () => {
    await setupClientConfig(knownClientId);

    const responseConfiguration = exampleResponseConfig();

    const config = Config.getInstance();

    jest.spyOn(config, "getAuthCodeRequestParams").mockReturnValue({
      ...validAuthRequestParams,
      responseConfiguration,
    });

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

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

    const decodedAccessToken = decodeJwtNoVerify(access_token);
    const decodedIdToken = decodeJwtNoVerify(id_token);

    expect(expires_in).toEqual(180);
    expect(token_type).toEqual("Bearer");

    expect(decodedAccessToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedAccessToken.payload.sub).toBe(responseConfiguration.sub);
    expect(decodedAccessToken.payload.client_id).toBe(knownClientId);
    expect(decodedAccessToken.payload.sid).toBe(SESSION_ID);
    expect(decodedAccessToken.payload.scope).toStrictEqual(
      validAuthRequestParams.scopes
    );
    expect(decodedAccessToken.payload.claims).toEqual(VALID_CLAIMS);
    expect(decodedIdToken.protectedHeader).toStrictEqual({
      alg: "RS256",
      kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    });
    expect(decodedIdToken.payload.sub).toBe(responseConfiguration.sub);
    expect(decodedIdToken.payload.iss).toBe("http://localhost:3000/");
    expect(decodedIdToken.payload.vtm).toBe("http://localhost:3000/trustmark");
    expect(decodedIdToken.payload.aud).toBe(knownClientId);
    expect(decodedIdToken.payload.sid).toBe(SESSION_ID);
    expect(decodedIdToken.payload.nonce).toBe(validAuthRequestParams.nonce);
    expect(decodedIdToken.payload.vot).toBe(
      validAuthRequestParams.vtr.credentialTrust
    );
    expect(decodedIdToken.payload.iat).toBe(Math.floor(TIME_NOW / 1000));
    expect(decodedIdToken.payload.exp).toBe(
      Math.floor(TIME_NOW / 1000) + ID_TOKEN_EXPIRY
    );
    expect(decodedIdToken.payload.auth_time).toBe(Math.floor(TIME_NOW / 1000));

    expect(
      config.getResponseConfigurationForAccessToken(access_token)
    ).toStrictEqual(responseConfiguration);
  });
});

describe('when PKCE_ENABLED is set to "true"', () => {
  beforeAll(() => {
    process.env.PKCE_ENABLED = "true";
  });

  afterAll(() => {
    delete process.env.PKCE_ENABLED;
  });

  it("returns 200 with valid code verifier and code challenge", async () => {
    await setupClientConfig(knownClientId);
    const codeChallengeValidAuthRequestParams = {
      ...validAuthRequestParams,
      code_challenge: "eIe4S9eBZL3SvHEtvsxhvN4FQ8ln3VmwUQvjdVJ-VEY",
    };

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(codeChallengeValidAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
      code_verifier: "eR_WWqemjlNa509bCR7_d4QlvhM1OYLmv5AmlEdjrlE",
    });

    expect(response.status).toEqual(200);
  });

  it("returns 400 with invalid code challenge and code verifier pair", async () => {
    await setupClientConfig(knownClientId);
    const codeChallengeValidAuthRequestParams = {
      ...validAuthRequestParams,
      code_challenge: "eIe4S9eBZL3SvHEtvsxhvN4FQ8ln3VmwUQvjdVJ-VLL",
    };

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(codeChallengeValidAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
      code_verifier: "eR_WWqemjlNa509bCR7_d4QlvhM1OYLmv5AmlEdjrlE",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "PKCE code verification failed",
    });
  });

  it("returns 400 with missing code challenge", async () => {
    await setupClientConfig(knownClientId);

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(validAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
      code_verifier: "eR_WWqemjlNa509bCR7_d4QlvhM1OYLmv5AmlEdjrlE",
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "PKCE code verification failed",
    });
  });

  it("returns 400 with missing code verifier", async () => {
    await setupClientConfig(knownClientId);
    const codeChallengeValidAuthRequestParams = {
      ...validAuthRequestParams,
      code_challenge: "eIe4S9eBZL3SvHEtvsxhvN4FQ8ln3VmwUQvjdVJ-VEY",
    };

    jest
      .spyOn(Config.getInstance(), "getAuthCodeRequestParams")
      .mockReturnValue(codeChallengeValidAuthRequestParams);

    const clientAssertion = await createValidClientAssertion({
      iss: knownClientId,
      sub: knownClientId,
      aud: audience,
      jti: randomUUID(),
      iat: Math.floor(TIME_NOW / 1000),
      exp: Math.floor(TIME_NOW / 1000) + 3600,
    });

    const app = createApp();
    const response = await request(app).post(TOKEN_ENDPOINT).send({
      grant_type: "authorization_code",
      code: knownAuthCode,
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      redirect_uri: redirectUri,
      client_assertion: clientAssertion,
    });

    expect(response.status).toEqual(400);
    expect(response.body).toStrictEqual({
      error: "invalid_grant",
      error_description: "PKCE code verification failed",
    });
  });
});
