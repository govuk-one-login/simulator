import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import {
  getClaimsKeys,
  getRequestObjectVtrAsString,
  parseRequestObjectClaims,
} from "../utils";

describe("Utils test", () => {
  describe("get vtr as string", () => {
    it("convert vtr array to string", () => {
      const payload = {
        vtr: ["Cl.Cm"],
      };

      expect(getRequestObjectVtrAsString(payload)).toBe('["Cl.Cm"]');
    });

    it("throws an error if provided a non-string array", () => {
      const payload = {
        vtr: [1234, true, null, undefined, []],
        redirect_uri: "http://example.com/auth-callback",
        state: "12345",
      };
      expect(() => getRequestObjectVtrAsString(payload)).toThrow(
        new AuthoriseRequestError({
          errorCode: "invalid_request",
          errorDescription: "Request vtr not valid",
          httpStatusCode: 302,
          redirectUri: "http://example.com/auth-callback",
          state: "12345",
        })
      );
    });

    it("returns a string vtr as is", () => {
      const payload = {
        vtr: '["Cl.Cm"]',
      };

      expect(getRequestObjectVtrAsString(payload)).toBe('["Cl.Cm"]');
    });
  });
  describe("parse claims", () => {
    it("get claims when inside userinfo object", () => {
      const claims = '{"userinfo": { "claim1": "a", "claim2": "b" }}';

      expect(getClaimsKeys(claims)).toStrictEqual(["claim1", "claim2"]);
    });

    it("get no claims when userinfo field not present", () => {
      const claims = '{"claim1": "a", "claim2": "b" }';

      expect(getClaimsKeys(claims)).toHaveLength(0);
    });
  });

  describe("parseRequestObjectClaims tests", () => {
    it("it parses a JSON claims request and returns the userinfo claim keys", () => {
      expect(
        parseRequestObjectClaims({
          userinfo: {
            claim1: { essential: true },
            claim2: { essential: true },
          },
        })
      ).toStrictEqual(["claim1", "claim2"]);
    });

    it("it parses a string JSON claims request and returns the userinfo claim keys", () => {
      expect(
        parseRequestObjectClaims(
          '{"userinfo":{"claim1":{"essential":true},"claim2":{"essential":true}}}'
        )
      ).toStrictEqual(["claim1", "claim2"]);
    });
  });
});
