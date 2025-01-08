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
  vtr: [],
  prompt: [],
  ui_locales: [],
  max_age: 123,
};

describe("validateAuthRequestQueryParams tests", () => {
  it("throws a bad request error if the client id does not match the config ", () => {
    expect(() =>
      validateAuthRequestQueryParams(
        {
          ...defaultAuthRequest,
          client_id: "not-in-config",
        },
        config
      )
    ).toThrow(new BadRequestError("Invalid request"));
  });

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
});
