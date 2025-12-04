import { randomUUID } from "crypto";
import { createApp } from "../../src/app";
import request from "supertest";
import {
  EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY,
  EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY,
  RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_TOKEN_SIGNING_KEY,
  RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
} from "../../src/constants";
import { importPKCS8, SignJWT } from "jose";
import { Config } from "../../src/config";

const LOGOUT_ENDPOINT = "/logout";
const DEFAULT_LOGGED_OUT_URL = "https://gov.uk";
const DEFAULT_CLIENT_ID = "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw";

const fakeIdToken = async (
  payload: Record<string, unknown>,
  algorithm: "ES256" | "RS256" = "ES256",
  useNewKeysToSign = false
): Promise<string> => {
  if (algorithm === "ES256") {
    const keyId = useNewKeysToSign
      ? EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID
      : EC_PRIVATE_TOKEN_SIGNING_KEY_ID;
    const privateKey = await importPKCS8(
      useNewKeysToSign
        ? EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY
        : EC_PRIVATE_TOKEN_SIGNING_KEY,
      "ES256"
    );
    return await new SignJWT(payload)
      .setProtectedHeader({ kid: keyId, alg: "ES256" })
      .sign(privateKey);
  } else {
    const keyId = useNewKeysToSign
      ? RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID
      : RSA_PRIVATE_TOKEN_SIGNING_KEY_ID;

    const privateKey = await importPKCS8(
      useNewKeysToSign
        ? RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY
        : RSA_PRIVATE_TOKEN_SIGNING_KEY,
      algorithm
    );
    return await new SignJWT(payload)
      .setProtectedHeader({ kid: keyId, alg: algorithm })
      .sign(privateKey);
  }
};

describe("logout endpoint", () => {
  beforeEach(() => {
    delete process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS;
    delete process.env.USE_NEW_ID_TOKEN_SIGNING_KEYS;
    Config.resetInstance();
  });

  test("An empty logout request just redirects to the default logout endpoint", async () => {
    const app = createApp();
    const response = await request(app).get(LOGOUT_ENDPOINT);
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(DEFAULT_LOGGED_OUT_URL);
  });

  test("An logout request with only containing state redirects to the default logout endpoint with state", async () => {
    const state = randomUUID();
    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?${new URLSearchParams({
        state,
      }).toString()}`
    );
  });

  test("A logout request which has an id_token_hint with an invalid signature redirects with an error message", async () => {
    const state = randomUUID();
    const idTokenHint =
      "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?${new URLSearchParams({
        error_code: "invalid_request",
        error_description: "unable to validate id_token_hint",
        state,
      }).toString()}`
    );
  });

  test("A logout request which has an id_token_hint with an unknown client redirects to default logout endpoint with error", async () => {
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: randomUUID(),
      sid: randomUUID(),
      sub: randomUUID(),
    });
    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?${new URLSearchParams({
        error_code: "unauthorized_client",
        error_description: "client not found",
        state,
      }).toString()}`
    );
  });

  test("A logout request which has a valid id_token_hint with no clientId (aud) redirects to the default endpoint with no errors", async () => {
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      sid: randomUUID(),
      sub: randomUUID(),
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?state=${state}`
    );
  });

  test("A logout request which has a valid id_token_hint with no rpPairwiseId (sub) redirects to the default endpoint with no errors", async () => {
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: DEFAULT_CLIENT_ID,
      sid: randomUUID(),
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?state=${state}`
    );
  });

  test("A logout request which has a valid id_token_hint with no post_logout_redirect_uri redirects to the default endpoint with no errors", async () => {
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: DEFAULT_CLIENT_ID,
      sid: randomUUID(),
      sub: randomUUID(),
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?state=${state}`
    );
  });

  test("A logout request which has a valid id_token_hint but invalid post_logout_redirect_uri will redirect to the default with an error", async () => {
    const postLogoutRedirectUri = "https://example.com/oidc/post-logout";
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: DEFAULT_CLIENT_ID,
      sid: randomUUID(),
      sub: randomUUID(),
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?${new URLSearchParams({
        error_code: "invalid_request",
        error_description:
          "client registry does not contain post_logout_redirect_uri",
        state,
      }).toString()}`
    );
  });

  test("A logout request which has a valid id_token_hint and a matching redirect url that is not a valid url is redirected to with an error", async () => {
    const postLogoutRedirectUri = "      ";
    Config.getInstance().setPostLogoutRedirectUrls([postLogoutRedirectUri]);
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: DEFAULT_CLIENT_ID,
      sid: randomUUID(),
      sub: randomUUID(),
      exp: Date.now() / 1000,
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${DEFAULT_LOGGED_OUT_URL}?${new URLSearchParams({
        error_code: "invalid_request",
        error_description: "invalid post logout redirect URI",
        state,
      }).toString()}`
    );
  });

  test("A valid logout request will redirect to the post_logout_redirect_uri", async () => {
    const postLogoutRedirectUri = "https://example.com/oidc/post-logout";
    Config.getInstance().setPostLogoutRedirectUrls([postLogoutRedirectUri]);
    const state = randomUUID();
    const idTokenHint = await fakeIdToken({
      aud: DEFAULT_CLIENT_ID,
      sid: randomUUID(),
      sub: randomUUID(),
    });

    const app = createApp();
    const response = await request(app).get(
      `${LOGOUT_ENDPOINT}?&state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
    );
    expect(response.status).toEqual(302);
    expect(response.headers.location).toStrictEqual(
      `${postLogoutRedirectUri}?state=${state}`
    );
  });

  //https://github.com/govuk-one-login/simulator/issues/290
  //https://openid.net/specs/openid-connect-rpinitiated-1_0.html#:~:text=When%20an%20id_token_hint,act%20upon%20it.
  test.each(["RS256", "ES256"])(
    "It accepts an expired valid id_token_hint and redirects to the post logout redirect url signed with %s",
    async (alg) => {
      const postLogoutRedirectUri = "https://example.com/oidc/post-logout";
      Config.getInstance().setPostLogoutRedirectUrls([postLogoutRedirectUri]);
      const state = randomUUID();
      const idTokenHint = await fakeIdToken(
        {
          aud: DEFAULT_CLIENT_ID,
          sid: randomUUID(),
          sub: randomUUID(),
          //Thu Jan 01 1970 03:25:45 in Unix timestamp
          exp: 12345,
        },
        alg as "ES256" | "RS256"
      );

      const app = createApp();
      const response = await request(app).get(
        `${LOGOUT_ENDPOINT}?&state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
      );
      expect(response.status).toEqual(302);
      expect(response.headers.location).toStrictEqual(
        `${postLogoutRedirectUri}?state=${state}`
      );
    }
  );

  test.each(["RS256", "ES256"])(
    "When USE_NEW_ID_TOKEN_SIGNING_KEYS enabled it validates using the new id_token signing keys with alg % ",
    async (alg) => {
      process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS = "true";
      process.env.USE_NEW_ID_TOKEN_SIGNING_KEYS = "true";
      Config.resetInstance();

      const postLogoutRedirectUri = "https://example.com/oidc/post-logout";
      Config.getInstance().setPostLogoutRedirectUrls([postLogoutRedirectUri]);
      const state = randomUUID();
      const idTokenHint = await fakeIdToken(
        {
          aud: DEFAULT_CLIENT_ID,
          sid: randomUUID(),
          sub: randomUUID(),
        },
        alg as "ES256" | "RS256",
        true
      );

      const app = createApp();
      const response = await request(app).get(
        `${LOGOUT_ENDPOINT}?&state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
      );
      expect(response.status).toEqual(302);
      expect(response.headers.location).toStrictEqual(
        `${postLogoutRedirectUri}?state=${state}`
      );
    }
  );

  // This is something to consider when we do the actual rotation, we keep accepting the old key in the cut-over to ensure that in the course of a session we still accept previously valid signed ID tokens
  test.each(["RS256", "ES256"])(
    "When USE_NEW_ID_TOKEN_SIGNING_KEYS enabled it accepts an id token signed by a the previous key with alg % ",
    async (alg) => {
      process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS = "true";
      process.env.USE_NEW_ID_TOKEN_SIGNING_KEYS = "true";
      Config.resetInstance();

      const postLogoutRedirectUri = "https://example.com/oidc/post-logout";
      Config.getInstance().setPostLogoutRedirectUrls([postLogoutRedirectUri]);
      const state = randomUUID();
      const idTokenHint = await fakeIdToken(
        {
          aud: DEFAULT_CLIENT_ID,
          sid: randomUUID(),
          sub: randomUUID(),
        },
        alg as "ES256" | "RS256",
        false
      );

      const app = createApp();
      const response = await request(app).get(
        `${LOGOUT_ENDPOINT}?&state=${state}&id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`
      );
      expect(response.status).toEqual(302);
      expect(response.headers.location).toStrictEqual(
        `${postLogoutRedirectUri}?state=${state}`
      );
    }
  );
});
