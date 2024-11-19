import { randomUUID } from "crypto";
import { createApp } from "../../src/app";
import request from "supertest";
import {
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
} from "../../src/constants";
import { importPKCS8, SignJWT } from "jose";
import { Config } from "../../src/config";

const LOGOUT_ENDPOINT = "/logout";
const DEFAULT_LOGGED_OUT_URL = "http://localhost:3000/signed-out";
const DEFAULT_CLIENT_ID = "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw";

const fakeIdToken = async (
  payload: Record<string, unknown>
): Promise<string> => {
  const keyId = EC_PRIVATE_TOKEN_SIGNING_KEY_ID;
  const privateKey = await importPKCS8(EC_PRIVATE_TOKEN_SIGNING_KEY, "ES256");
  return await new SignJWT(payload)
    .setExpirationTime("5m")
    .setProtectedHeader({ kid: keyId, alg: "ES256" })
    .sign(privateKey);
};

describe("logout endpoint", () => {
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
});
