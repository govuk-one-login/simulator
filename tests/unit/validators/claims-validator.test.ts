import {
  ClaimsParameter,
  Client,
  errors,
  KoaContextWithOIDC,
} from "oidc-provider";
import { Config } from "../../../src/config";
import { claimsValidator } from "../../../src/validators/claims-validator";
import { jest } from "@jest/globals";

describe("claims validator test", () => {
  const mockContext = {} as KoaContextWithOIDC;
  const mockClient = {} as Client;
  const configClaimsSpy = jest.spyOn(Config.getInstance(), "getClaims");

  it("throws an invalid request error for an invalid claim", () => {
    const invalidClaimsParameter: ClaimsParameter = {
      userinfo: {
        invalid_claim: null,
      },
    };
    expect(() =>
      claimsValidator(mockContext, invalidClaimsParameter, mockClient)
    ).toThrow(
      new errors.InvalidRequest("Request contains invalid claims", 302)
    );
  });

  it("throws an invalid request error for a claim not in the client configuration", () => {
    configClaimsSpy.mockReturnValue([
      "https://vocab.account.gov.uk/v1/address",
    ]);
    const validClaims: ClaimsParameter = {
      userinfo: {
        "https://vocab.account.gov.uk/v1/passport": null,
      },
    };
    expect(() => claimsValidator(mockContext, validClaims, mockClient)).toThrow(
      new errors.InvalidRequest("Request contains invalid claims", 302)
    );
  });

  it("does not throw for a valid claim set request", () => {
    configClaimsSpy.mockReturnValue([
      "https://vocab.account.gov.uk/v1/passport",
    ]);
    const validClaims: ClaimsParameter = {
      userinfo: {
        "https://vocab.account.gov.uk/v1/passport": null,
      },
    };
    expect(() =>
      claimsValidator(mockContext, validClaims, mockClient)
    ).not.toThrow();
  });
});
