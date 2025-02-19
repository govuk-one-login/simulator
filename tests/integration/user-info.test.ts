import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";
import { Config } from "../../src/config";
import { EC_PRIVATE_TOKEN_SIGNING_KEY } from "../../src/constants";
import { createApp } from "../../src/app";
import request from "supertest";
import { UserIdentityClaim, UserInfo } from "../../src/types/user-info";
import ReturnCode from "../../src/types/return-code";
import { decodeJwtNoVerify } from "./helper/decode-jwt-no-verify";
import { exampleResponseConfig } from "./helper/test-constants";

const USER_INFO_ENDPOINT = "/userinfo";
const KNOWN_CLIENT_ID = "d76db56760ceda7cab875f085c54bd35";
const KNOWN_SUB_CLAIM =
  "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
const INVALID_EC_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnEpemWfQ6m2Fxo6ENP13NkocvvrAKHc/IWbC+jSOc/uhRANCAARcsKXyN+lhvtj4KzR1QNYqHE2OWFK8W3dap/x1mO/OYN6D6f9KWLXy6+Nrnp11SB5Qj9IMUWPQUBolJLSaxhBI-----END PRIVATE KEY-----";
const EC_PUBLIC_IDENTITY_SIGNING_KEY =
  "-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdgH3plJS09HqOu/AMSuHhlsaZJPfX4uaVfotrnanBslUYagQcFDX7I6x9N3fMxrgOctMmnteYo2NWYO3jwJzBA==-----END PUBLIC KEY-----";
const AUTHORIZATION_HEADER_KEY: string = "authorization";
const AUTHENTICATE_HEADER_KEY: string = "www-authenticate";
const ISSUER_VALUE = "http://localhost:3000/";
const TRUSTMARK_VALUE = "http://localhost:3000/trustmark";
const EXAMPLE_VERIFIABLE_CREDENTIAL: object = {
  type: ["VerifiableCredential"],
  credentialSubject: {
    name: [
      {
        nameParts: [
          {
            value: "John",
            type: "GivenName",
          },
          {
            value: "Smith",
            type: "FamilyName",
            validUntil: "1999-12-31",
          },
          {
            value: "Jones",
            type: "FamilyName",
            validFrom: "2000-01-01",
          },
        ],
      },
    ],
    birthDate: [
      {
        value: "1980-01-01",
      },
    ],
  },
};
const EXAMPLE_RETURN_CODE: ReturnCode[] = [{ code: "example_code" }];

describe("/userinfo endpoint", () => {
  it("returns an error for missing header", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const response = await request(app).get(USER_INFO_ENDPOINT);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe("Bearer");
    expect(response.body).toStrictEqual({});
  });

  it("returns a invalid_token error for badly formed header", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = "invalid-access-token";
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token response for a header without Bearer ", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const accessToken =
      "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, accessToken);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_scope error for invalid scope", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["invalid-scope"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_scope", error_description="Invalid, unknown or malformed scope"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_scope error for unexpected scope", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email"], false);
    const app = createApp();
    const config = Config.getInstance();
    const accessToken = await createAccessToken(
      config.getIssuerValue(),
      KNOWN_CLIENT_ID,
      ["openid", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_scope", error_description="Invalid, unknown or malformed scope"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for missing client id", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      null,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for unexpected client id", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      "unexpected-client-id",
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for expired token", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      new Date(2000, 0, 1)
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for invalid signature", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      INVALID_EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for unexpected issuer", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const app = createApp();
    const accessToken = await createAccessToken(
      "unexpected-issuer",
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid token error if the access token is not in the accessToken store", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
  });

  it("returns expected status and bearer value for invalid token", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      false
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
  });

  it("returns an invalid token error if the access does not match the one in the access token store", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    addAccessTokenToStore(
      KNOWN_CLIENT_ID,
      KNOWN_SUB_CLAIM,
      "not-the-same-access-token"
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
  });

  it("returns expected user info for valid token", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    const expectedUserInfo: UserInfo = {
      email: "test@example.com",
      email_verified: true,
      phone_number: "07123456789",
      phone_number_verified: true,
      sub: KNOWN_SUB_CLAIM,
    };

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(response.body).toStrictEqual(expectedUserInfo);
  });
});

describe("/userinfo endpoint with identity verification enabled", () => {
  it("returns an invalid_request error for a request with an unsupported claim", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/passport",
      ]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_request", error_description="Invalid request"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns expected user info for valid token with null claims", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      null
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    const expectedUserInfo: UserInfo = {
      email: "test@example.com",
      email_verified: true,
      phone_number: "07123456789",
      phone_number_verified: true,
      sub: KNOWN_SUB_CLAIM,
    };

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(response.body).toStrictEqual(expectedUserInfo);
  });

  it("returns expected user info for valid token with supported claims", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]
    );
    const nowBeforeSeconds = Math.floor(Date.now() / 1000);
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
          returnCodes: EXAMPLE_RETURN_CODE,
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);
    const nowAfterSeconds = Math.floor(Date.now() / 1000);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body).sort()).toEqual(
      [
        "email",
        "email_verified",
        "phone_number",
        "phone_number_verified",
        "sub",
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ].sort()
    );
    expect(response.body.email).toEqual("test@example.com");
    expect(response.body.email_verified).toEqual(true);
    expect(response.body.phone_number).toEqual("07123456789");
    expect(response.body.phone_number_verified).toEqual(true);
    expect(response.body.sub).toEqual(
      "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="
    );

    expect(response.body["https://vocab.account.gov.uk/v1/returnCode"]).toEqual(
      EXAMPLE_RETURN_CODE
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    const { payload } = await jwtVerify(coreIdentityJwt, publicKey);
    expect(payload.aud).toEqual("d76db56760ceda7cab875f085c54bd35");
    expect(payload.iss).toEqual(ISSUER_VALUE);
    expect(payload.sub).toEqual(
      "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="
    );
    expect(payload.vot).toEqual("P2");
    expect(payload.vtm).toEqual(TRUSTMARK_VALUE);
    expect(payload.nbf).toBeGreaterThanOrEqual(nowBeforeSeconds);
    expect(payload.exp).toBeGreaterThan(nowBeforeSeconds);
    expect(payload.iat).toBeGreaterThanOrEqual(nowBeforeSeconds);
    expect(payload.iat).toBeLessThanOrEqual(nowAfterSeconds);
    expect(payload.vc).toEqual(EXAMPLE_VERIFIABLE_CREDENTIAL);
  });

  it("for scenario INVALID_ALG_HEADER: returns coreIdentityJWT with incorrect header alg", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INVALID_ALG_HEADER"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const { protectedHeader } = await decodeJwtNoVerify(coreIdentityJwt);
    expect(protectedHeader.alg).not.toEqual("ES256");
  });

  it("for scenario INVALID_SIGNATURE: returns coreIdentityJWT with invalid signature", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INVALID_SIGNATURE"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    expect(jwtVerify(coreIdentityJwt, publicKey)).rejects.toThrow();
  });

  it("for scenario INVALID_ISS: returns coreIdentityJWT with invalid iss", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INVALID_ISS"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    const { payload } = await jwtVerify(coreIdentityJwt, publicKey);
    expect(payload.iss).not.toEqual("https://oidc.account.gov.uk");
  });

  it("for scenario INVALID_AUD: returns coreIdentityJWT with invalid aud", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INVALID_AUD"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    const { payload } = await jwtVerify(coreIdentityJwt, publicKey);
    expect(payload.aud).not.toEqual("d76db56760ceda7cab875f085c54bd35");
  });

  it("for scenario INCORRECT_SUB: returns coreIdentityJWT with incorrect sub", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INCORRECT_SUB"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    const { payload } = await jwtVerify(coreIdentityJwt, publicKey);
    expect(payload.sub).not.toEqual(
      "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw="
    );
  });

  it("for scenario TOKEN_EXPIRED: returns coreIdentityJWT with exp in past", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      ["https://vocab.account.gov.uk/v1/coreIdentityJWT"]
    );
    addAccessTokenToStore(KNOWN_CLIENT_ID, KNOWN_SUB_CLAIM, accessToken);
    const app = createApp();

    const configResponse = await request(app)
      .post("/config")
      .send({
        responseConfiguration: {
          coreIdentityVerifiableCredentials: EXAMPLE_VERIFIABLE_CREDENTIAL,
        },
        errorConfiguration: {
          coreIdentityErrors: ["TOKEN_EXPIRED"],
        },
      });
    expect(configResponse.status).toBe(200);

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body)).toContain(
      "https://vocab.account.gov.uk/v1/coreIdentityJWT"
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const { payload } = await decodeJwtNoVerify(coreIdentityJwt);
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeLessThan(nowSeconds);
  });
});

describe('when INTERACTIVE_MODE is set to "true"', () => {
  beforeAll(() => {
    process.env.INTERACTIVE_MODE = "true";
  });

  afterAll(() => {
    delete process.env.INTERACTIVE_MODE;
  });

  it("returns expected user info for valid token", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );

    const sub = "sample-sub";
    const responseConfig = {
      ...exampleResponseConfig(),
      sub,
    };

    Config.getInstance().addToResponseConfigurationStore(
      accessToken,
      responseConfig
    );

    const app = createApp();
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);

    const expectedUserInfo: UserInfo = {
      email: responseConfig.email,
      email_verified: responseConfig.emailVerified,
      phone_number: responseConfig.phoneNumber,
      phone_number_verified: responseConfig.phoneNumberVerified,
      sub,
    };

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(response.body).toStrictEqual(expectedUserInfo);
  });

  it("returns expected user info with additional claims for a valid access_token", async () => {
    await setupClientConfig(
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      true,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]
    );
    const accessToken = await createAccessToken(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      undefined,
      [
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]
    );
    const nowBeforeSeconds = Math.floor(Date.now() / 1000);
    const sub = "sample-sub";
    const responseConfig = {
      ...exampleResponseConfig(),
      sub,
    };

    Config.getInstance().addToResponseConfigurationStore(
      accessToken,
      responseConfig
    );

    const app = createApp();

    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, `Bearer ${accessToken}`);
    const nowAfterSeconds = Math.floor(Date.now() / 1000);

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(Object.keys(response.body).sort()).toEqual(
      [
        "email",
        "email_verified",
        "phone_number",
        "phone_number_verified",
        "sub",
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ].sort()
    );
    expect(response.body.email).toEqual(responseConfig.email);
    expect(response.body.email_verified).toEqual(responseConfig.emailVerified);
    expect(response.body.phone_number).toEqual(responseConfig.phoneNumber);
    expect(response.body.phone_number_verified).toEqual(
      responseConfig.phoneNumberVerified
    );
    expect(response.body.sub).toEqual(responseConfig.sub);

    expect(response.body["https://vocab.account.gov.uk/v1/returnCode"]).toEqual(
      responseConfig.returnCodes
    );

    const coreIdentityJwt =
      response.body["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    const publicKey = await importSPKI(EC_PUBLIC_IDENTITY_SIGNING_KEY, "ES256");
    const { payload } = await jwtVerify(coreIdentityJwt, publicKey);
    expect(payload.aud).toEqual("d76db56760ceda7cab875f085c54bd35");
    expect(payload.iss).toEqual(ISSUER_VALUE);
    expect(payload.sub).toEqual(responseConfig.sub);
    expect(payload.vot).toEqual(responseConfig.maxLoCAchieved);
    expect(payload.vtm).toEqual(TRUSTMARK_VALUE);
    expect(payload.nbf).toBeGreaterThanOrEqual(nowBeforeSeconds);
    expect(payload.exp).toBeGreaterThan(nowBeforeSeconds);
    expect(payload.iat).toBeGreaterThanOrEqual(nowBeforeSeconds);
    expect(payload.iat).toBeLessThanOrEqual(nowAfterSeconds);
    expect(payload.vc).toEqual(
      responseConfig.coreIdentityVerifiableCredentials
    );
  });
});

async function createAccessToken(
  issuer: string,
  clientId: string | null,
  scopes: string[],
  privateKey: string,
  expiry?: Date,
  claims?: UserIdentityClaim[] | null
): Promise<string> {
  let signedJwtBuilder = new SignJWT({
    client_id: clientId,
    scope: scopes,
    claims: claims,
  })
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer(issuer);

  if (expiry) {
    signedJwtBuilder = signedJwtBuilder.setExpirationTime(expiry);
  }

  const signedJwt = await signedJwtBuilder.sign(
    await importPKCS8(privateKey, "EC")
  );

  return signedJwt;
}

const setupClientConfig = async (
  clientId: string,
  scopes: string[],
  identityVerificationSupported: boolean = false,
  claims: UserIdentityClaim[] = []
) => {
  process.env.CLIENT_ID = clientId;
  process.env.SCOPES = scopes.join(",");
  process.env.IDENTITY_VERIFICATION_SUPPORTED =
    identityVerificationSupported.toString();
  process.env.CLAIMS = claims.join(",");
  Config.resetInstance();
};

const addAccessTokenToStore = (
  clientId: string,
  sub: string,
  accessToken: string
): void => {
  Config.getInstance().addToAccessTokenStore(`${clientId}.${sub}`, accessToken);
};
