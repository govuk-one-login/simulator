import { randomUUID } from "crypto";
import { createApp } from "../../../app";
import request from "supertest";
import { Config } from "../../../config";

const authoriseEndpoint = "/authorize";
const knownClientId = "43c729a8f8a8bed3441a872039d45180";
const knownRedirectUri = "https://example.com/authentication-callback";
const unknownRedirectUri =
  "https://some.other.client.example.com/auth-callback";

const createRequestParams = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");
};

describe("/authorize GET controller: invalid request non-redirecting errors", () => {
  beforeAll(() => {
    process.env.CLIENT_ID = knownClientId;
    process.env.REDIRECT_URLS = knownRedirectUri;
  });

  it("returns a Missing Parameters response for no query strings", async () => {
    const app = createApp();
    const response = await request(app).get(authoriseEndpoint);
    expect(response.status).toBe(400);
    expect(response.text).toBe("Request is missing parameters");
  });

  it("returns an Missing Parameters response for an no client_id", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      state: "51994f8e382a5c6ffa19d2518b190696",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Request is missing parameters");
  });

  it("returns an Missing Parameters response for no response_type", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Request is missing parameters");
  });

  it("returns invalid request for a non-oidc prompt", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      response_type: "code",
      prompt: "login unknown",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid Request");
  });

  it("returns an Missing Parameters response for a no redirect uri", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      response_type: "code",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Request is missing parameters");
  });

  it("returns an Missing Parameters response for a badly formatted redirect uri", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: ".notaredirectURI..",
      response_type: "code",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Request is missing parameters");
  });

  it("returns an Invalid request response for non-matching redirect_uri", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: unknownRedirectUri,
      response_type: "code",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid Request");
  });

  it("returns an Invalid request response for an unknown client_id", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: randomUUID(),
      redirect_uri: knownRedirectUri,
      response_type: "code",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(400);
    expect(response.text).toBe("Invalid Request");
  });
});

describe("/authorize GET controller: Invalid request, redirecting errors", () => {
  beforeEach(() => {
    process.env.CLIENT_ID = knownClientId;
    process.env.REDIRECT_URLS = knownRedirectUri;
    process.env.SCOPES = "openid,email";
    process.env.CLAIMS = "https://vocab.account.gov.uk/v1/coreIdentityJWT";
    process.env.CLIENT_LOCS = "P2";
    Config.resetInstance();
  });

  it("redirects with an invalid request error response for no scope parameter", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid Request")}`
    );
  });

  it("redirects with an invalid request error for a scope which does not include openid ", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "email",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid Request")}`
    );
  });

  it("returns 302 and redirects with an error for invalid JSON in claims", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      claims: "{{}",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid Request")}`
    );
  });

  it("returns 302 and redirects with an error for unknown prompt", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login unknown",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid Request")}`
    );
  });

  it("returns 302 and redirects with an error for no state", async () => {
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request is missing state parameter")}`
    );
  });

  it("returns 302 and redirects if the request includes a request_uri", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login",
      state,
      request_uri: "https:/example.com/request-uri/12345",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=request_uri_not_supported&error_description=${encodeURIComponent("Request URI parameter not supported")}&state=${state}`
    );
  });

  it("returns 302 and redirects if the response_type is not code", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "id_token",
      scope: "openid email",
      prompt: "login",
      state,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=unsupported_response_type&error_description=${encodeURIComponent("Unsupported response type")}&state=${state}`
    );
  });

  it("returns 302 and redirects with an error for invalid scope", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid unknown",
      prompt: "login",
      state,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
    );
  });

  it("returns 302 and redirects with an error for unsupported scope", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid phone",
      prompt: "login",
      state,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
    );
  });

  it("returns 302 and redirects with an error for unknown claim", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login",
      state,
      claims: '{"userinfo":{"unknownClaim":null}}',
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request contains invalid claims")}&state=${state}`
    );
  });

  it("returns 302 and redirects with an error for an unsupported claim", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login",
      state,
      claims: '{"userinfo":{"https://vocab.account.gov.uk/v1/passport":null}}',
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request contains invalid claims")}&state=${state}`
    );
  });

  it("returns 302 and redirects with an error for no nonce value", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      prompt: "login",
      state,
      claims:
        '{"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null}}',
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request is missing nonce parameter")}&state=${state}`
    );
  });

  it.each(["[]]", '["Ch"]', '["Cl.P2"]', '["Cl.Cm.P2","Cl.Cm"]'])(
    "returns 302 and redirects with an error for invalid Vtr value %s",
    async (vtrValue) => {
      const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
      const app = createApp();
      const requestParams = createRequestParams({
        client_id: knownClientId,
        redirect_uri: knownRedirectUri,
        response_type: "code",
        scope: "openid email",
        prompt: "login",
        state,
        claims:
          '{"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null}}',
        nonce: "3eb5b04ca8e1baf7dea15b7fb7ac05a6",
        vtr: vtrValue,
      });
      const response = await request(app).get(
        authoriseEndpoint + "?" + requestParams
      );
      expect(response.status).toBe(302);
      expect(response.header.location).toBe(
        `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request vtr not valid")}&state=${state}`
      );
    }
  );
});

describe("valid auth request", () => {
  beforeEach(() => {
    process.env.CLIENT_ID = knownClientId;
    process.env.REDIRECT_URLS = knownRedirectUri;
    process.env.SCOPES = "openid,email";
    process.env.CLAIMS = "https://vocab.account.gov.uk/v1/coreIdentityJWT";
    process.env.CLIENT_LOCS = "P2";
    Config.resetInstance();
  });

  it("returns 302 and redirect with an auth code for a valid minimal auth request", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const nonce = "3eb5b04ca8e1baf7dea15b7fb7ac05a6";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      state,
      nonce,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?code=c87fe9af6880180fbb73a77597395053&state=${state}`
    );
  });

  it("returns 302 and redirect with an auth code for a valid auth request with claims", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const nonce = "3eb5b04ca8e1baf7dea15b7fb7ac05a6";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      state,
      claims:
        '{"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null}}',
      nonce,
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?code=c87fe9af6880180fbb73a77597395053&state=${state}`
    );
  });

  it("returns 302 and redirect with an auth code for a valid auth request with claims and prompt", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const nonce = "3eb5b04ca8e1baf7dea15b7fb7ac05a6";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      state,
      claims:
        '{"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null}}',
      nonce,
      prompt: "login",
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?code=c87fe9af6880180fbb73a77597395053&state=${state}`
    );
  });

  it("returns 302 and redirect with an auth code for a valid auth request with claims, prompt and valid vtr", async () => {
    const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
    const nonce = "3eb5b04ca8e1baf7dea15b7fb7ac05a6";
    const app = createApp();
    const requestParams = createRequestParams({
      client_id: knownClientId,
      redirect_uri: knownRedirectUri,
      response_type: "code",
      scope: "openid email",
      state,
      claims:
        '{"userinfo":{"https://vocab.account.gov.uk/v1/coreIdentityJWT":null}}',
      nonce,
      prompt: "login",
      vtr: '["Cl.Cm.P2"]',
    });
    const response = await request(app).get(
      authoriseEndpoint + "?" + requestParams
    );
    expect(response.status).toBe(302);
    expect(response.header.location).toBe(
      `${knownRedirectUri}?code=c87fe9af6880180fbb73a77597395053&state=${state}`
    );
  });
});
