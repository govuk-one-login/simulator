import { randomUUID } from "crypto";
import { createApp } from "../../src/app";
import request from "supertest";
import { ISSUER_VALUE } from "../../src/constants/provider-config";

const testEnvVars = {
  CLIENT_ID: "TEST_CLIENT_ID",
  SCOPES: "openid,email,phone",
  REDIRECT_URLS: "http://localhost:8080/authorization-code/callback",
  CLAIMS: "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  IDENTITY_VERIFICATION_SUPPORTED: "true",
  ID_TOKEN_SIGNING_ALGORITHM: "RS256",
  CLIENT_LOCS: "P2",
};

const urlEncodeComponent = (key: string, value: string) =>
  `&${key}=${encodeURIComponent(value)}`;

const constructClientRequestUri = (params: Record<string, string>): string => {
  return (
    "/authorize?" +
    urlEncodeComponent("response_type", "code") +
    Object.entries(params)
      .map(([key, val]) => urlEncodeComponent(key, val))
      .join("")
  );
};

describe("oidc tests", () => {
  beforeAll(() => {
    Object.entries(testEnvVars).map(([key, val]) => {
      process.env[key] = val;
    });
  });

  it("redirects to redirect uri and returns an error for an invalid claim", async () => {
    const state = randomUUID();
    const app = await createApp();
    const requestUri = constructClientRequestUri({
      client_id: testEnvVars.CLIENT_ID,
      claims: JSON.stringify({
        userinfo: {
          ["someInvalidClaim"]: null,
        },
      }),
      vtr: JSON.stringify(["Cl.Cm.P2"]),
      nonce: (Math.random() * 1000).toString(),
      state,
      redirect_uri: testEnvVars.REDIRECT_URLS,
      scope: testEnvVars.SCOPES.split(",").join(" "),
    });
    const response = await request(app).get(requestUri);
    expect(response.status).toEqual(303);
    expect(response.header.location).toStrictEqual(
      testEnvVars.REDIRECT_URLS +
        `?error=invalid_request${urlEncodeComponent("error_description", "Request contains invalid claims")}${urlEncodeComponent("state", state)}${urlEncodeComponent("iss", ISSUER_VALUE)}`
    );
  });

  it("redirects to redirect uri and returns an error for an invalid vtr", async () => {
    const state = randomUUID();
    const app = await createApp();
    const requestUri = constructClientRequestUri({
      client_id: testEnvVars.CLIENT_ID,
      claims: JSON.stringify({
        userinfo: {
          [testEnvVars.CLAIMS]: null,
        },
      }),
      vtr: JSON.stringify(["Cl.Cm.P0"]),
      nonce: (Math.random() * 1000).toString(),
      state,
      redirect_uri: testEnvVars.REDIRECT_URLS,
      scope: testEnvVars.SCOPES.split(",").join(" "),
    });
    const response = await request(app).get(requestUri);
    expect(response.status).toEqual(303);
    expect(response.header.location).toStrictEqual(
      testEnvVars.REDIRECT_URLS +
        `?error=invalid_request${urlEncodeComponent("error_description", "Request vtr not valid")}${urlEncodeComponent("state", state)}${urlEncodeComponent("iss", ISSUER_VALUE)}`
    );
  });

  it("returns a 400 and Bad Request for an unknown clientId", async () => {
    const state = randomUUID();
    const app = await createApp();
    const requestUri = constructClientRequestUri({
      client_id: "some-invalid-clientId",
      claims: JSON.stringify({
        userinfo: {
          [testEnvVars.CLAIMS]: null,
        },
      }),
      vtr: JSON.stringify(["Cl.Cm.P2"]),
      nonce: (Math.random() * 1000).toString(),
      state,
      redirect_uri: testEnvVars.REDIRECT_URLS,
      scope: testEnvVars.SCOPES.split(",").join(" "),
    });
    const response = await request(app).get(requestUri);
    expect(response.status).toEqual(400);
    expect(response.text).toStrictEqual("Bad Request");
  });

  it("returns a 400 and Bad Request for a no redirectUri", async () => {
    const state = randomUUID();
    const app = await createApp();
    const requestUri = constructClientRequestUri({
      client_id: testEnvVars.CLIENT_ID,
      claims: JSON.stringify({
        userinfo: {
          [testEnvVars.CLAIMS]: null,
        },
      }),
      vtr: JSON.stringify(["Cl.Cm.P2"]),
      nonce: (Math.random() * 1000).toString(),
      state,
      scope: testEnvVars.SCOPES.split(",").join(" "),
    });
    const response = await request(app).get(requestUri);
    expect(response.status).toEqual(400);
    expect(response.text).toStrictEqual("Bad Request");
  });

  it("redirects to the redirectUri with an auth code for a valid auth request", async () => {
    const state = randomUUID();
    const app = await createApp();
    const requestUri = constructClientRequestUri({
      client_id: testEnvVars.CLIENT_ID,
      claims: JSON.stringify({
        userinfo: {
          [testEnvVars.CLAIMS]: null,
        },
      }),
      vtr: JSON.stringify(["Cl.Cm.P2"]),
      state,
      scope: testEnvVars.SCOPES.split(",").join(" "),
      nonce: (Math.random() * 1000).toString(),
      redirect_uri: testEnvVars.REDIRECT_URLS,
    });
    const agent = request.agent(app);

    const authorizeResponse = await agent.get(requestUri);
    const loginInteractionRedirect = authorizeResponse.header.location;
    expect(authorizeResponse.status).toEqual(303);
    expect(loginInteractionRedirect).toContain("/interaction/");

    const postLoginRedirect = await agent.get(
      loginInteractionRedirect as string
    );

    const authCodeRedirect = await agent.get(
      new URL(postLoginRedirect.header.location as string).pathname
    );

    const authCodeRedirectUrl = authCodeRedirect.header.location;

    expect(authCodeRedirectUrl).toContain(
      testEnvVars.REDIRECT_URLS + "?" + "code="
    );
    expect(authCodeRedirectUrl).toContain(urlEncodeComponent("state", state));
    expect(authCodeRedirectUrl).toContain(
      urlEncodeComponent("iss", ISSUER_VALUE)
    );
  });
});
