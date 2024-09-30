import { UserIdentityClaim } from "../../types/user-info";

const areClaimsValidMock = jest.fn();
const areScopesValidMock = jest.fn();
const vtrValidatorMock = jest.fn();

import { parseAuthQueryParams } from "../../parse/parse-auth-request-query-params";
import { ParseAuthRequestError } from "../../errors/parse-auth-request-error";
import { Config } from "../../config";
import { BadRequestError } from "../../errors/bad-request-error";
import { randomUUID } from "crypto";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { MissingParameterError } from "../../errors/missing-parameter-error";

jest.mock("../../validators/claims-validator", () => ({
  areClaimsValid: areClaimsValidMock,
}));

jest.mock("../../validators/scope-validator", () => ({
  areScopesValid: areScopesValidMock,
}));

jest.mock("../../validators/vtr-validator", () => ({
  vtrValidator: vtrValidatorMock,
}));

const clientId = "284e6ac9818525b254053711c9251fa7";
const redirectUri = "https://example.com/authenication-callback";
const clientLoCs = ["P0", "P2"];
const claims: UserIdentityClaim[] = [
  "https://vocab.account.gov.uk/v1/passport",
];
const state = "6066cf5d190e2f1d5eeabaf089c01529ec47f7e3833d574f";
const mockVtr = [
  {
    levelOfConfidence: null,
    credentialTrust: "Cl.Cm",
  },
];

describe("parseAuthRequestQueryParams tests", () => {
  const config = Config.getInstance();

  jest.spyOn(config, "getClientId").mockReturnValue(clientId);
  jest.spyOn(config, "getRedirectUrls").mockReturnValue([redirectUri]);
  jest.spyOn(config, "getClientLoCs").mockReturnValue(clientLoCs);
  jest.spyOn(config, "getClaims").mockReturnValue(claims);

  it("throws a missingParameter error for an empty request", () => {
    expect(() => parseAuthQueryParams({}, config)).toThrow(
      new MissingParameterError(
        "Invalid Request: No Query parameters present in request"
      )
    );
  });

  it("throws a parse request error for no client_id", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new MissingParameterError("Invalid Request: Missing client_id parameter")
    );
  });

  it("throws a parse request error for no response_type", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          redirect_uri: redirectUri,
          client_id: clientId,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new MissingParameterError(
        "Invalid Request: Missing response_type parameter"
      )
    );
  });

  it("throws a parse request error if the prompt value is invalid", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "no-an-oidc-prompt",
        },
        config
      )
    ).toThrow(
      new ParseAuthRequestError(
        "Invalid Request: Invalid prompt parameter",
        redirectUri,
        clientId
      )
    );
  });

  it("throws a missing parameter error for no  redirect_uri", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new MissingParameterError(
        "Invalid Request: Invalid redirect_uri parameter"
      )
    );
  });

  it("throws a parse request error for an invalid redirect_uri", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: "not-a-valid-uri",
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new MissingParameterError(
        "Invalid Request: Invalid redirect_uri parameter"
      )
    );
  });

  it("throws a parse request error for no scope", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new ParseAuthRequestError(
        "Invalid Request: Missing scope parameter",
        redirectUri,
        clientId
      )
    );
  });

  it("throws a parse request error for a response_type that is not a valid OIDC respone_type", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          client_id: clientId,
          response_type: "notValid",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
          scope: "openid",
        },
        config
      )
    ).toThrow(
      new ParseAuthRequestError(
        "Invalid Request: Unsupported response_type parameter",
        redirectUri,
        clientId
      )
    );
  });

  it("throws a parse request error for no openid scope", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          scope: "email phone",
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new ParseAuthRequestError(
        "Invalid Request: The scope must include an openid value",
        redirectUri,
        clientId
      )
    );
  });

  it("throws a parse request error if the claims have invalid JSON", () => {
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims: "{{{{{{{{{{}",
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new ParseAuthRequestError("Invalid JSON in claims", redirectUri, clientId)
    );
  });

  it("throws a bad request error if the client id does not match the config ", () => {
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: "not-in-the-config",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(new BadRequestError("Invalid request"));
  });

  it("throws a bad request error if the redirect_uri is not in the config", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri + "/" + randomUUID(),
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(new BadRequestError("Invalid request"));
  });

  it("throws an authoriseRequestError if there is no state value", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing state parameter",
        httpStatusCode: 302,
        redirectUri: redirectUri,
        state: null,
      })
    );
  });

  it("throws an authoriseRequestError if the request_uri parameter is present ", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
          request_uri: "https://example.com/some-request-uri",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "request_uri_not_supported",
        errorDescription: "Request URI parameter not supported",
        httpStatusCode: 302,
        redirectUri: redirectUri,
        state: state,
      })
    );
  });

  it("throws an authoriseRequestError if the response_type is not code", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "token",
          client_id: clientId,
          redirect_uri: redirectUri,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "unsupported_response_type",
        errorDescription: "Unsupported response type",
        httpStatusCode: 302,
        redirectUri,
        state,
      })
    );
  });

  it("throws an authoriseRequestError if the scopes are not valid", () => {
    areScopesValidMock.mockReturnValue(false);
    areClaimsValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);

    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_scope",
        errorDescription: "Invalid, unknown or malformed scope",
        httpStatusCode: 302,
        redirectUri,
        state,
      })
    );
  });

  it("throws an authoriseRequestError if the the claims are invalid", () => {
    areScopesValidMock.mockReturnValue(true);
    areClaimsValidMock.mockReturnValue(false);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request contains invalid claims",
        httpStatusCode: 302,
        redirectUri,
        state,
      })
    );
  });

  it("throws an authoriseRequestError if there is no nonce included", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing nonce parameter",
        httpStatusCode: 302,
        redirectUri: redirectUri,
        state: state,
      })
    );
  });

  it("throws an error if the vtrValidator throws", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    const error = new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request vtr not valid",
      httpStatusCode: 302,
      state,
      redirectUri,
    });
    vtrValidatorMock.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          prompt: "none",
        },
        config
      )
    ).toThrow(error);
  });

  it("throws an authoriseRequestError if the prompt includes select_account", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);
    expect(() =>
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "select_account",
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
        },
        config
      )
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "unmet_authentication_requirements",
        errorDescription: "Unmet authentication requirements",
        httpStatusCode: 302,
        state: state,
        redirectUri: redirectUri,
      })
    );
  });

  it("returns a parsedAuthRequest ", () => {
    areClaimsValidMock.mockReturnValue(true);
    areScopesValidMock.mockReturnValue(true);
    vtrValidatorMock.mockReturnValue(mockVtr);

    expect(
      parseAuthQueryParams(
        {
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          prompt: "none",
        },
        config
      )
    ).toStrictEqual({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: ["openid", "email", "phone"],
      claims: [
        "https://vocab.account.gov.uk/v1/passport",
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/address",
      ],
      vtr: mockVtr,
      nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
      prompt: ["none"],
      ui_locales: [],
    });
  });
});
