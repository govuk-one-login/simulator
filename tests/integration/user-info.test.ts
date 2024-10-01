import { importPKCS8, SignJWT } from "jose";
import { Config } from "../../src/config";
import { EC_PRIVATE_TOKEN_SIGNING_KEY } from "../../src/constants";
import { createApp } from "../../src/app";
import request from "supertest";
import { UserInfo } from "../../src/types/user-info";

const USER_INFO_ENDPOINT = "/userinfo";
const KNOWN_CLIENT_ID = "d76db56760ceda7cab875f085c54bd35";
const KNOWN_SUB_CLAIM =
  "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
const INVALID_EC_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnEpemWfQ6m2Fxo6ENP13NkocvvrAKHc/IWbC+jSOc/uhRANCAARcsKXyN+lhvtj4KzR1QNYqHE2OWFK8W3dap/x1mO/OYN6D6f9KWLXy6+Nrnp11SB5Qj9IMUWPQUBolJLSaxhBI-----END PRIVATE KEY-----";
const AUTHORIZATION_HEADER_KEY: string = "authorization";
const AUTHENTICATE_HEADER_KEY: string = "www-authenticate";
const ISSUER_VALUE = "http://host.docker.internal:3000/";

describe("/userinfo endpoint tests, invalid request", () => {
  it("returns an error for missing header", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const response = await request(app).get(USER_INFO_ENDPOINT);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe("Bearer");
    expect(response.body).toStrictEqual({});
  });

  it("returns a invalid_token error for badly formed header", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
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

async function createAccessToken(
  issuer: string,
  clientId: string | null,
  scopes: string[],
  privateKey: string,
  expiry?: Date
): Promise<string> {
  let signedJwtBuilder = new SignJWT({ client_id: clientId, scope: scopes })
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

const setupClientConfig = async (clientId: string, scopes: string[]) => {
  process.env.CLIENT_ID = clientId;
  process.env.SCOPES = scopes.join(",");
  Config.resetInstance();
};

const addAccessTokenToStore = (
  clientId: string,
  sub: string,
  accessToken: string
): void => {
  Config.getInstance().addToAccessTokenStore(`${clientId}.${sub}`, accessToken);
};
