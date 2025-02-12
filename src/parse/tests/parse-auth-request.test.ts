import { parseAuthRequest } from "../parse-auth-request";
import { ParseAuthRequestError } from "../../errors/parse-auth-request-error";
import { MissingParameterError } from "../../errors/missing-parameter-error";

const clientId = "284e6ac9818525b254053711c9251fa7";
const redirectUri = "https://example.com/authenication-callback";
const state = "6066cf5d190e2f1d5eeabaf089c01529ec47f7e3833d574f";
const claims =
  '{"userinfo":{"https://vocab.account.gov.uk/v1/passport":{"essential":true},"https://vocab.account.gov.uk/v1/address":{"essential":true},"https://vocab.account.gov.uk/v1/drivingPermit":{"essential":true},"https://vocab.account.gov.uk/v1/coreIdentityJWT":{"essential":true},"https://vocab.account.gov.uk/v1/returnCode":{"essential":true}}}';

const testHeader: Record<string, string | undefined> = { alg: "test-alg" };

describe("parseAuthRequest tests", () => {
  describe("parseAuthRequest query params tests", () => {
    it("throws a missingParameter error for an empty request", () => {
      expect(() => parseAuthRequest({})).toThrow(
        new MissingParameterError(
          "Invalid Request: No Query parameters present in request"
        )
      );
    });

    it("throws a parse request error for no client_id", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        })
      ).toThrow(
        new MissingParameterError(
          "Invalid Request: Missing client_id parameter"
        )
      );
    });

    it("throws a parse request error if the prompt value is invalid", () => {
      expect(() =>
        parseAuthRequest({
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
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid Request: Invalid prompt parameter",
          redirectUri,
          clientId
        )
      );
    });

    it("throws a missing parameter error for no redirect_uri", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid Request: Missing redirect_uri parameter"
        )
      );
    });

    it("throws a parse request error for an invalid redirect_uri", () => {
      expect(() =>
        parseAuthRequest({
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
        })
      ).toThrow(
        new MissingParameterError(
          "Invalid Request: Invalid redirect_uri parameter"
        )
      );
    });

    it("throws a parse request error for no scope", () => {
      expect(() =>
        parseAuthRequest({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          claims:
            '{"userinfo":{"https:\\/\\/vocab.account.gov.uk\\/v1\\/passport":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT":{"essential":true},"https:\\/\\/vocab.account.gov.uk\\/v1\\/address":{"essential":true}}}',
          vtr: '["Cl.Cm"]',
          prompt: "none",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid Request: Missing scope parameter",
          redirectUri,
          clientId
        )
      );
    });

    it("throws a parse request error for a response_type that is not a valid OIDC response_type", () => {
      expect(() =>
        parseAuthRequest({
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
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid Request: Invalid response_type parameter",
          redirectUri,
          clientId
        )
      );
    });

    it("throws a parse request error for no openid scope", () => {
      expect(() =>
        parseAuthRequest({
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
        })
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
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
          scope: "openid email phone",
          claims: "{{{{{{{{{{}",
          vtr: '["Cl.Cm"]',
          prompt: "none",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid JSON in claims",
          redirectUri,
          clientId
        )
      );
    });

    it("returns a parsedAuthRequest ", () => {
      expect(
        parseAuthRequest({
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
        })
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
        vtr: '["Cl.Cm"]',
        nonce: "8b5376320b7d9307627a5ad9512da4f84555d96fe9517365",
        prompt: ["none"],
        ui_locales: [],
        requestObject: undefined,
        request_uri: undefined,
        max_age: -1,
      });
    });
  });

  describe("parseAuthRequest request object tests", () => {
    it("parses an auth request with a request object", () => {
      const parsedRequest = parseAuthRequest({
        response_type: "code",
        client_id: clientId,
        scope: "openid",
        request: defaultEncodedJwt,
      });

      expect(parsedRequest).toStrictEqual({
        response_type: "code",
        client_id: clientId,
        requestObject: {
          header: testHeader,
          payload: {
            redirect_uri: redirectUri,
            client_id: clientId,
            response_type: "code",
            state: state,
            iss: clientId,
            scope: "openid",
            aud: "http://localhost:8080/authorize",
            nonce: "987654321",
            max_age: 123,
            claims,
          },
          encodedJwt: defaultEncodedJwt,
        },
        redirect_uri: undefined,
        state: undefined,
        scope: ["openid"],
        claims: [],
        vtr: undefined,
        nonce: undefined,
        prompt: [],
        ui_locales: [],
        request_uri: undefined,
        max_age: -1,
      });
    });

    it("throws if mutually exclusive request and request_uri parameters are present", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          scope: "openid",
          request: defaultEncodedJwt,
          request_uri: "https://example.com/request-object/12345",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid request: Found mutually exclusive request and request_uri parameters",
          clientId,
          redirectUri
        )
      );
    });

    it("throws if the client_id of the auth request matches the request object subject", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          scope: "openid",
          request: encodedJwtWithParams({
            sub: clientId,
          }),
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid request parameter: The JWT sub (subject) claim must not equal the client_id"
        )
      );
    });

    it("throws if jwt does not contain a '.' delimiter", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          scope: "openid",
          request: "notAJwt",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid request parameter: Invalid JWT serialization: Missing dot delimiter"
        )
      );
    });

    it("throws if the jwt header is not valid JSON", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          scope: "openid",
          request: "ewoibm90SlNvbiI6IAoKfQ==.",
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid request parameter: Invalid JWT header: Failed to parse JSON"
        )
      );
    });

    it("throws if the jwt header does not contain an 'alg' value", () => {
      expect(() =>
        parseAuthRequest({
          response_type: "code",
          client_id: clientId,
          scope: "openid",
          request: encodedJwtWithParams({}, {}),
        })
      ).toThrow(
        new ParseAuthRequestError(
          "Invalid request parameter: Invalid JWT header: Missing alg in header"
        )
      );
    });

    const encodedJwtWithParams = (
      params: Record<string, string>,
      header = testHeader
    ): string => {
      const payload = {
        redirect_uri: redirectUri,
        client_id: clientId,
        response_type: "code",
        state: state,
        iss: clientId,
        scope: "openid",
        aud: "http://localhost:8080/authorize",
        nonce: "987654321",
        max_age: 123,
        claims,
        ...params,
      };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        "base64url"
      );

      const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
        "base64url"
      );

      const encodedSignature =
        "nwwnNsk1ZkbmnvsF6zTHm8CHERFMGQPhosEJcaH4HhsMgk8ePrGhw_trPYs8KQxsn6R9Emo_wHwajyFKzuMXZFSZ3p6Mb8dkxtVyjoy2GIzvuJT_u7PkY2t8QU9hjBcHs68PkgjDVTrG1uRTx0GxFbuPbj96tVuj11pTnmFCUR6IEOXKYr7iGOCRB3btfJhM0_AKQUfqKnRlrRscc8KolcSLWoYE9l5QqholImzjT_cMnNIznW9E7CDyWXTsO70xnB4SkG6pXfLSjLLlxmPGiyon_-Te111V8uE83IlzCYIb_NMXvtTIVc1jpspnTSD7xMbpL-2QgwUsAlMGzw";

      return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    };
    const defaultEncodedJwt = encodedJwtWithParams({});
  });
});
