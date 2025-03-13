import { Config } from "../../config";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { AuthRequest } from "../../parse/parse-auth-request";

import { validateAuthRequestQueryParams } from "../validate-auth-request-query-params";

const config = Config.getInstance();
const defaultRedirectUri = config.getRedirectUrls()[0];
const defaultState = "123456789";
const defaultClientId = config.getClientId();
const validClaim = "https://vocab.account.gov.uk/v1/coreIdentityJWT";
const defaultAuthRequest = {
  response_type: "code",
  redirect_uri: defaultRedirectUri,
  client_id: defaultClientId,
  state: defaultState,
  nonce: "987654321",
  scope: ["openid"],
  claims: [validClaim],
  vtr: '["Cl.Cm"]',
  prompt: [],
  ui_locales: [],
  max_age: 123,
};

describe("validateAuthRequestQueryParams tests", () => {
  it("throws a bad request error if the redirect_uri is not in the config", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          redirect_uri: "https://example.com/auth-callback",
        },
        config
      )
    ).toThrow(new BadRequestError("Invalid request"));
  });

  it("throws an authoriseRequestError if there is no state value", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        { ...defaultAuthRequest, state: undefined } as unknown as AuthRequest,
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing state parameter",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: null,
      })
    );
  });

  it("throws an authoriseRequestError if the request_uri parameter is present ", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          request_uri: "https://example.com/request-jwt/id=213344354243423",
        }!,
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "request_uri_not_supported",
        errorDescription: "Request URI parameter not supported",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an authoriseRequestError if the response_type is not code", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          response_type: "id_token",
        }!,
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "unsupported_response_type",
        errorDescription: "Unsupported response type",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an authoriseRequestError if the scopes are not valid", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          scope: ["openid", "profile"],
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_scope",
        errorDescription: "Invalid, unknown or malformed scope",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an authoriseRequestError if the the claims are invalid", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          claims: ["invalid-claim"],
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request contains invalid claims",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an authoriseRequestError if there is no nonce included", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          nonce: undefined,
        } as unknown as AuthRequest,
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing nonce parameter",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an error if the vtrValidator throws", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          vtr: '["invalid-vtr"]',
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throws an invalid request error for max_age less than -1", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          max_age: -100,
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Max age is negative in query params",
        httpStatusCode: 302,
        redirectUri: defaultAuthRequest.redirect_uri,
        state: defaultAuthRequest.state,
      })
    );
  });

  it("throw authorise request error when response mode is not query or fragment", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          response_mode: "code",
        },
        config
      )
    ).toThrow(new BadRequestError("Invalid request"));
  });

  describe('when PKCE_ENABLED is set to "true"', () => {
    beforeAll(() => {
      jest.spyOn(config, "isPKCEEnabled").mockReturnValue(true);
    });

    afterAll(() => {
      jest.spyOn(config, "isPKCEEnabled").mockReturnValue(false);
    });

    it("throw authorise request error when code challenge method is not S256", () => {
      expect(() =>
        validateAuthRequestQueryParams(
          {
            ...defaultAuthRequest,
            code_challenge_method: "not-S256",
            code_challenge: "code-challenge",
          },
          config
        )
      ).toThrow(
        new AuthoriseRequestError({
          errorCode: "invalid_request",
          errorDescription:
            "Invalid value for code_challenge_method parameter.",
          httpStatusCode: 302,
          redirectUri: defaultAuthRequest.redirect_uri,
          state: defaultAuthRequest.state,
        })
      );
    });

    it("throw authorise request error when code challenge method is null", async () => {
      expect(() =>
        validateAuthRequestQueryParams(
          {
            ...defaultAuthRequest,
            code_challenge: "code-challenge",
          },
          config
        )
      ).toThrow(
        new AuthoriseRequestError({
          errorCode: "invalid_request",
          errorDescription:
            "Request is missing code_challenge_method parameter. code_challenge_method is required when code_challenge is present.",
          httpStatusCode: 302,
          redirectUri: defaultAuthRequest.redirect_uri,
          state: defaultAuthRequest.state,
        })
      );
    });

    it("throw authorise request error when code challenge is whitespace", () => {
      expect(() =>
        validateAuthRequestQueryParams(
          {
            ...defaultAuthRequest,
            code_challenge_method: "S256",
            code_challenge: " ",
          },
          config
        )
      ).toThrow(
        new AuthoriseRequestError({
          errorCode: "invalid_request",
          errorDescription: "Invalid value for code_challenge parameter.",
          httpStatusCode: 302,
          redirectUri: defaultAuthRequest.redirect_uri,
          state: defaultAuthRequest.state,
        })
      );
    });
  });
});
