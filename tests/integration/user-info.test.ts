import { importPKCS8, SignJWT } from "jose";
import { Config } from "../../src/config";
import {
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  ISSUER_VALUE,
} from "../../src/constants";
import { createApp } from "../../src/app";
import request from "supertest";
import { UserInfo } from "../../src/types/user-info";

const USER_INFO_ENDPOINT = "/userinfo";
const KNOWN_CLIENT_ID = "d76db56760ceda7cab875f085c54bd35";
const INVALID_EC_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnEpemWfQ6m2Fxo6ENP13NkocvvrAKHc/IWbC+jSOc/uhRANCAARcsKXyN+lhvtj4KzR1QNYqHE2OWFK8W3dap/x1mO/OYN6D6f9KWLXy6+Nrnp11SB5Qj9IMUWPQUBolJLSaxhBI-----END PRIVATE KEY-----";
const AUTHORIZATION_HEADER_KEY: string = "authorization";
const AUTHENTICATE_HEADER_KEY: string = "www-authenticate";

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
    const tokenHeader = "invalid-authentication-header";
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_scope error for invalid scope", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["invalid-scope"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_scope", error_description="Invalid, unknown or malformed scope"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_scope error for unexpected scope", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_scope", error_description="Invalid, unknown or malformed scope"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for missing client id", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      null,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for unexpected client id", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      "unexpected-client-id",
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for expired token", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY,
      new Date(2000, 0, 1)
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for invalid signature", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      INVALID_EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns an invalid_token error for unexpected issuer", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      "unexpected-issuer",
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    expect(response.status).toBe(401);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBe(
      'Bearer error="invalid_token", error_description="Invalid access token"'
    );
    expect(response.body).toStrictEqual({});
  });

  it("returns expected user info for valid token", async () => {
    await setupClientConfig(KNOWN_CLIENT_ID, ["openid", "email", "phone"]);
    const app = createApp();
    const tokenHeader = await generateTokenHeader(
      ISSUER_VALUE,
      KNOWN_CLIENT_ID,
      ["openid", "email", "phone"],
      EC_PRIVATE_TOKEN_SIGNING_KEY
    );
    const response = await request(app)
      .get(USER_INFO_ENDPOINT)
      .set(AUTHORIZATION_HEADER_KEY, tokenHeader);

    const expectedUserInfo: UserInfo = {
      email: "test@example.com",
      email_verified: true,
      phone_number: "07123456789",
      phone_number_verified: true,
      sub: "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
    };

    expect(response.status).toBe(200);
    expect(response.header[AUTHENTICATE_HEADER_KEY]).toBeUndefined();
    expect(response.body).toStrictEqual(expectedUserInfo);
  });
});

async function generateTokenHeader(
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

  return `Bearer ${signedJwt}`;
}

const setupClientConfig = async (clientId: string, scopes: string[]) => {
  process.env.CLIENT_ID = clientId;
  process.env.SCOPES = scopes.join(",");
  Config.resetInstance();
};
