import crypto, { generateKeyPairSync } from "crypto";
import { createApp } from "./../../src/app";
import request from "supertest";
import { Config } from "./../../src/config";
import {
  base64url,
  exportSPKI,
  JWK,
  JWTHeaderParameters,
  JWTPayload,
  SignJWT,
} from "jose";

const authoriseEndpoint = "/authorize";
const knownClientId = "43c729a8f8a8bed3441a872039d45180";
const knownRedirectUri = "https://example.com/authentication-callback";
const unknownRedirectUri =
  "https://some.other.client.example.com/auth-callback";

const fixedBuffer = Buffer.from(
  "6e4195129066135da2c81745247bb0edf82e00da5a8925d1a1289629ad8633"
);
const knownAuthCode = base64url.encode(fixedBuffer);
const state = "a7e4bfd39d3eaa57c27775744f22c5a2";
const nonce = "3eb5b04ca8e1baf7dea15b7fb7ac05a6";

const rsaKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const createRequestParams = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");
};

const encodedJwtWithParams = async (
  params: Record<string, unknown>,
  header: JWTHeaderParameters = {
    alg: "RS256",
    kid: "test-key-id",
  }
): Promise<string> => {
  const payload = {
    redirect_uri: knownRedirectUri,
    client_id: knownClientId,
    response_type: "code",
    state,
    iss: knownClientId,
    scope: "openid",
    aud: "http://localhost:8080/authorize",
    nonce,
    ...params,
  };
  return await signPayload(payload, header);
};

const signPayload = async (
  payload: JWTPayload,
  header: JWTHeaderParameters
): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader(header)
    .sign(rsaKeyPair.privateKey);
};

const mockJwks = (jwks: JWK[]): void => {
  jest.spyOn(global, "fetch").mockImplementation(
    jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            keys: jwks,
          }),
      })
    ) as jest.Mock
  );
};

describe("Authorise controller tests", () => {
  beforeEach(async () => {
    jest.spyOn(crypto, "randomBytes").mockImplementation(() => fixedBuffer);
    process.env.CLIENT_ID = knownClientId;
    process.env.REDIRECT_URLS = knownRedirectUri;
    process.env.SCOPES = "openid,email";
    process.env.CLAIMS = "https://vocab.account.gov.uk/v1/coreIdentityJWT";
    process.env.CLIENT_LOCS = "P2";
    process.env.PUBLIC_KEY = await exportSPKI(rsaKeyPair.publicKey);
    process.env.SIMULATOR_URL = "http://localhost:8080";
    Config.resetInstance();
  });

  describe("Auth requests using query params", () => {
    describe("/authorize GET controller: invalid request non-redirecting errors", () => {
      it("returns a Missing Parameters response for no query strings", async () => {
        const app = createApp();

        const response = await request(app).get(authoriseEndpoint);
        expect(response.status).toBe(400);
        expect(response.text).toBe("Request is missing parameters");
      });

      it("returns an Missing Parameters response for no client_id", async () => {
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

      it("returns an Missing Parameters response for no redirect uri", async () => {
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
          client_id: crypto.randomUUID(),
          redirect_uri: knownRedirectUri,
          response_type: "code",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid Request");
      });

      it("returns an invalid request for unknown response_mode", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          response_mode: "form_post",
          scope: "openid email",
          state,
          nonce,
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid Request");
      });
    });

    describe("/authorize GET controller: Invalid request, redirecting errors", () => {
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
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          prompt: "login",
          state,
          claims:
            '{"userinfo":{"https://vocab.account.gov.uk/v1/passport":null}}',
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

      it("returns 302 and redirects with an unmet_authentication_requirements error when the prompt includes select_account", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          state,
          nonce,
          prompt: "select_account",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?error=unmet_authentication_requirements&error_description=${encodeURIComponent("Unmet authentication requirements")}&state=${state}`
        );
      });
    });

    describe("valid auth request", () => {
      it("returns 302 and redirects with an access_denied error when the client has enabled ACCESS_DENIED", async () => {
        jest
          .spyOn(Config.getInstance(), "getAuthoriseErrors")
          .mockReturnValue(["ACCESS_DENIED"]);

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
          `${knownRedirectUri}?error=access_denied&error_description=${encodeURIComponent("Access denied by resource owner or authorization server")}&state=${state}`
        );
      });

      it("returns 302 and redirects with a temporarily_unavailable error when the client has enabled TEMPORARILY_UNAVAILABLE", async () => {
        jest
          .spyOn(Config.getInstance(), "getAuthoriseErrors")
          .mockReturnValue(["TEMPORARILY_UNAVAILABLE"]);

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
          `${knownRedirectUri}?error=temporarily_unavailable&error_description=&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid minimal auth request", async () => {
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
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid auth request with claims", async () => {
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
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid auth request with claims and prompt", async () => {
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
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid auth request with claims, prompt and valid vtr", async () => {
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
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code despite login_hint", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          state,
          nonce,
          login_hint: "email@email.com",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });
    });
  });

  describe("Auth requests using request objects", () => {
    describe("/authorize GET controller: invalid request non-redirecting errors", () => {
      it("returns a Bad Request response for invalid client ID", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: "unknown-client-id",
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid Request");
      });

      it("returns a validation failed response for invalid JWT signature", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: (await encodedJwtWithParams({})) + "a",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Trust chain validation failed");
      });

      it("returns a Invalid request response for a redirect_uri that does not match the client config", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            redirect_uri: "https://example.com/auth-callback",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid Request");
      });

      it("returns a 400 and Invalid request for an unknown response_mode", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            response_mode: "form_post",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(400);
        expect(response.text).toBe("Invalid Request");
      });

      it("returns a 500 response for badly formatted redirect_uri", async () => {
        const badUri = "http^^^^://";
        Config.getInstance().setRedirectUrls([knownRedirectUri, badUri]);
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            redirect_uri: "http^^^^://",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            message: "Internal Server Error",
          })
        );
      });

      it('returns a 500 response when request object missing required scope "openid"', async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            scope: "email",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            message: "Internal Server Error",
          })
        );
      });

      it("returns a 500 response when public key source is JWKS and no JWKS URL defined", async () => {
        const app = createApp();
        const config = Config.getInstance();
        config.setPublicKeySource("JWKS");
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            scope: "openid email",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            error: "server_error",
            error_description: "Unexpected server error",
          })
        );
      });

      it("returns a 500 response when public key source is JWKS and no kid present in header of JWT", async () => {
        const app = createApp();
        const config = Config.getInstance();
        config.setPublicKeySource("JWKS");
        config.setJwksUrl("http://example.com/.well-known/jwks.json");
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams(
            {
              scope: "openid email",
            },
            { alg: "RS256" }
          ),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            error: "server_error",
            error_description: "Unexpected server error",
          })
        );
      });

      it("returns a 500 response when public key source is JWKS and no key with kid found on JWKS endpoint", async () => {
        const app = createApp();
        const config = Config.getInstance();
        config.setPublicKeySource("JWKS");
        config.setJwksUrl("http://example.com/.well-known/jwks.json");
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams(
            {
              scope: "openid email",
            },
            { alg: "RS256", kid: "test-key-id" }
          ),
        });
        mockJwks([]);

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            error: "server_error",
            error_description: "Unexpected server error",
          })
        );
      });
    });

    describe("/authorize GET controller: invalid request redirecting errors", () => {
      it("returns 302 with invalid request for no state", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({ state: undefined }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request is missing state parameter")}`
        );
      });

      it("returns 302 with unsupported response type for non code response type at top level (not request object)", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "id_token",
          scope: "openid email",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unsupported_response_type&error_description=${encodeURIComponent("Unsupported response type")}&state=${state}`
        );
      });

      it("returns 302 with invalid scopes for request with unknown scopes at top level", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid profile",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
        );
      });

      it("returns 302 with invalid scopes for request with scopes the client is not configured for", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid phone",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
        );
      });

      it("returns 302 with unauthorized client for no client id in request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({ client_id: undefined }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unauthorized_client&error_description=${encodeURIComponent("Unauthorized client")}&state=${state}`
        );
      });

      it("returns 302 with unauthorized client when client id in request object does not match top level client id", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            client_id: "different-client-id",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unauthorized_client&error_description=${encodeURIComponent("Unauthorized client")}&state=${state}`
        );
      });

      it("returns 302 with invalid request when request present in request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            request: "another-request-object",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid request")}&state=${state}`
        );
      });

      it("returns 302 with invalid request when request uri present in request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            request_uri: "another-request-uri",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid request")}&state=${state}`
        );
      });

      it("returns 302 with access denied for no aud in request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            aud: undefined,
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=access_denied&error_description=${encodeURIComponent("Access denied by resource owner or authorization server")}&state=${state}`
        );
      });

      it("returns 302 with access denied when aud in request object does not match the authorise endpoint", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            aud: "http://not-authorise-endpoint.com/authorize",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=access_denied&error_description=${encodeURIComponent("Access denied by resource owner or authorization server")}&state=${state}`
        );
      });

      it("returns 302 with unauthorized client error when no issuer is in the request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            iss: undefined,
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unauthorized_client&error_description=${encodeURIComponent("Unauthorized client")}&state=${state}`
        );
      });

      it("returns 302 with unauthorized client error when issuer is in the request object does not match client_id", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            iss: "not-client-id",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unauthorized_client&error_description=${encodeURIComponent("Unauthorized client")}&state=${state}`
        );
      });

      it('returns 302 with unsupported response type when response type in request object is not "code"', async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            response_type: "id_token",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unsupported_response_type&error_description=${encodeURIComponent("Unsupported response type")}&state=${state}`
        );
      });

      it("returns a 302 with invalid scope error if the request object contains unknown scopes", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            scope: "openid profile",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
        );
      });

      it("returns a 302 with invalid scope error if the request object contains scopes the client is not configured for", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            scope: "openid phone",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_scope&error_description=${encodeURIComponent("Invalid, unknown or malformed scope")}&state=${state}`
        );
      });

      it("returns a 500 with Internal Server Error if the claims cannot be parsed", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            claims: ["invalid claims"],
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(500);
        expect(response.text).toBe(
          JSON.stringify({
            message: "Internal Server Error",
          })
        );
      });

      //ATO-1329: Validation will match this after this ticket is complete
      it("returns a 302 with invalid request if the request object claims contain unknown claims", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            claims: {
              userinfo: {
                invalidClaim: { essential: true },
              },
            },
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request contains invalid claims")}&state=${state}`
        );
      });

      it("returns a 302 with invalid request if the request object claims contain claims the client is not configured for", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            claims: {
              userinfo: {
                "https://vocab.account.gov.uk/v1/passport": { essential: true },
              },
            },
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request contains invalid claims")}&state=${state}`
        );
      });

      it("returns a 302 with invalid request if the request object has no nonce parameter", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            nonce: undefined,
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request is missing nonce parameter")}&state=${state}`
        );
      });

      it.each(["[]]", '["Ch"]', '["Cl.P2"]', '["Cl.Cm.P2","Cl.Cm"]'])(
        "returns 302 and redirects with an error for invalid Vtr value %s",
        async (vtrValue) => {
          const app = createApp();
          const requestParams = createRequestParams({
            client_id: knownClientId,
            redirect_uri: knownRedirectUri,
            response_type: "code",
            scope: "openid email",
            request: await encodedJwtWithParams({
              vtr: vtrValue,
            }),
          });

          const response = await request(app).get(
            authoriseEndpoint + "?" + requestParams
          );

          expect(response.status).toBe(302);
          expect(response.headers.location).toBe(
            `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Request vtr not valid")}&state=${state}`
          );
        }
      );

      it("returns a 302 with invalid request inf the max_age parameter is negative in the request object", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            max_age: -1000,
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Max age is negative in request object")}&state=${state}`
        );
      });

      it("returns a 302 with invalid request if the max_age parameter in the request object fails to be parsed to an integer", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            max_age: "notANumber",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Max age could not be parsed to an integer")}&state=${state}`
        );
      });

      it("returns a 302 with invalid request if the login_hint parameter in the request object fails validation", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            login_hint:
              "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111@email.com",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("login_hint parameter is invalid")}&state=${state}`
        );
      });

      it("returns a 302 with invalid request if the channel parameter in the request object is an invalid channel", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            channel: "invalid-channel",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid value for channel parameter.")}&state=${state}`
        );
      });

      it("returns a 302 with unmet authentication requirements if the prompt includes select_account", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            prompt: "select_account",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=unmet_authentication_requirements&error_description=${encodeURIComponent("Unmet authentication requirements")}&state=${state}`
        );
      });

      it("returns a 302 with access denied if error configuration includes ACCESS_DENIED", async () => {
        Config.getInstance().setAuthoriseErrors(["ACCESS_DENIED"]);

        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=access_denied&error_description=${encodeURIComponent("Access denied by resource owner or authorization server")}&state=${state}`
        );
      });
    });

    describe("valid auth request", () => {
      it("returns 302 and redirect with an auth code for a valid minimal auth request", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({}),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid auth request with all parameters", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            max_age: 123,
            prompt: "login",
            claims:
              '{"userinfo": { "https://vocab.account.gov.uk/v1/coreIdentityJWT": { "essential": true }}}',
            ui_locales: "en",
            login_hint: "email@email.com",
            channel: "generic_app",
          }),
        });
        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code when validating signature using JWKS", async () => {
        const app = createApp();
        const config = Config.getInstance();
        config.setPublicKeySource("JWKS");
        config.setJwksUrl("http://example.com/.well-known/jwks.json");
        const publicKeyJwk = rsaKeyPair.publicKey.export({ format: "jwk" });
        mockJwks([
          {
            ...(publicKeyJwk as JWK),
            kid: "test-key-id",
            use: "sig",
            alg: "RS256",
          },
        ]);
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams(
            {},
            {
              alg: "RS256",
              kid: "test-key-id",
            }
          ),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });
    });
  });

  describe("Auth request with INTERACTIVE_MODE enabled", () => {
    beforeAll(() => {
      process.env.INTERACTIVE_MODE = "true";
    });

    afterAll(() => {
      delete process.env.INTERACTIVE_MODE;
    });

    it("renders a html form with an embeded auth code request object and encoded authRequest params", async () => {
      const app = createApp();
      const requestParams = createRequestParams({
        client_id: knownClientId,
        redirect_uri: knownRedirectUri,
        response_type: "code",
        scope: "openid email",
        request: await encodedJwtWithParams({
          scope: "openid email",
          max_age: 123,
          prompt: "login",
          claims:
            '{"userinfo": { "https://vocab.account.gov.uk/v1/coreIdentityJWT": { "essential": true }}}',
          ui_locales: "en",
        }),
      });

      const response = await request(app).get(
        authoriseEndpoint + "?" + requestParams
      );

      expect(response.status).toBe(200);

      const authCodeRegex =
        /<input type="hidden" name="authCode" value="(?<authCode>[A-Za-z0-9+/\-_]+)"\/>/;
      const authRequestParamRegex =
        /<input type="hidden" name="authRequestParams" value="(?<authRequestParams>[A-Za-z0-9+/\-_]+)"\/>/;

      expect(response.text).toMatch(authCodeRegex);
      expect(response.text).toMatch(authRequestParamRegex);

      const { authCode } = authCodeRegex.exec(response.text)!.groups!;
      expect(authCode).toBe(knownAuthCode);

      const { authRequestParams } = authRequestParamRegex.exec(
        response.text
      )!.groups!;

      const decodedParams = JSON.parse(
        Buffer.from(base64url.decode(authRequestParams)).toString()
      );

      expect(decodedParams.scopes).toStrictEqual(["openid", "email"]);
      expect(decodedParams.redirectUri).toStrictEqual(knownRedirectUri);
      expect(decodedParams.nonce).toStrictEqual(nonce);
      expect(decodedParams.claims).toStrictEqual([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
      ]);
      expect(decodedParams.vtr).toStrictEqual({
        levelOfConfidence: null,
        credentialTrust: "Cl.Cm",
      });
    });

    it("renders a html form with embeded auth code query params and encoded authRequest params", async () => {
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

      expect(response.status).toBe(200);

      const htmlRegex =
        /<input type="hidden" name="authCode" value="(?<authCode>[A-Za-z0-9+/\-_]+)"\/>/;
      const authRequestParamRegex =
        /<input type="hidden" name="authRequestParams" value="(?<authRequestParams>[A-Za-z0-9+/\-_]+)"\/>/;

      expect(response.text).toMatch(htmlRegex);

      const { authCode } = htmlRegex.exec(response.text)!.groups!;
      expect(authCode).toBe(knownAuthCode);

      const { authRequestParams } = authRequestParamRegex.exec(
        response.text
      )!.groups!;

      const decodedParams = JSON.parse(
        Buffer.from(base64url.decode(authRequestParams)).toString()
      );

      expect(decodedParams.scopes).toStrictEqual(["openid", "email"]);
      expect(decodedParams.redirectUri).toStrictEqual(knownRedirectUri);
      expect(decodedParams.nonce).toStrictEqual(nonce);
      expect(decodedParams.claims).toStrictEqual([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
      ]);
      expect(decodedParams.vtr).toStrictEqual({
        levelOfConfidence: "P2",
        credentialTrust: "Cl.Cm",
      });
    });
  });

  describe("Auth request with PKCE_ENABLED enabled", () => {
    beforeAll(() => {
      process.env.PKCE_ENABLED = "true";
    });

    afterAll(() => {
      delete process.env.PKCE_ENABLED;
    });

    describe("Auth requests using query params", () => {
      it("returns 302 and redirect with an auth code for a invalid code challenge method", async () => {
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
          code_challenge: "code-challenge",
          code_challenge_method: "not-S256",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid value for code_challenge_method parameter.")}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for an empty code challenge", async () => {
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
          code_challenge: " ",
          code_challenge_method: "S256",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid value for code_challenge parameter.")}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid code challenge", async () => {
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
          code_challenge: "code-challenge",
          code_challenge_method: "S256",
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });
    });

    describe("Auth requests using request objects", () => {
      it("returns 302 for request with invalid code challenge method", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            code_challenge: "code-challenge",
            code_challenge_method: "not-S256",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid value for code_challenge_method parameter.")}&state=${state}`
        );
      });

      it("returns 302 for request with empty code challenge", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            code_challenge: " ",
            code_challenge_method: "S256",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe(
          `${knownRedirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid value for code_challenge parameter.")}&state=${state}`
        );
      });

      it("returns 302 and redirect with an auth code for a valid code challenge", async () => {
        const app = createApp();
        const requestParams = createRequestParams({
          client_id: knownClientId,
          redirect_uri: knownRedirectUri,
          response_type: "code",
          scope: "openid email",
          request: await encodedJwtWithParams({
            code_challenge: "code-challenge",
            code_challenge_method: "S256",
          }),
        });

        const response = await request(app).get(
          authoriseEndpoint + "?" + requestParams
        );

        expect(response.status).toBe(302);
        expect(response.header.location).toBe(
          `${knownRedirectUri}?code=${knownAuthCode}&state=${state}`
        );
      });
    });
  });
});
