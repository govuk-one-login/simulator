import { jest } from "@jest/globals";
import { Client, errors, KoaContextWithOIDC } from "oidc-provider";
import { scopeValidator } from "../../../src/validators/scope-validator";
import { Config } from "../../../src/config";

describe("scopeValidator tests", () => {
  it("throws an Invalid Scope error for unknown scopes", () => {
    const mockContext = {
      URL: {
        searchParams: {
          get: (key: string) => {
            if (key === "scope") return "openid phone unknown";
            else return null;
          },
        },
      },
    } as KoaContextWithOIDC;
    expect(() =>
      scopeValidator(mockContext, "openid phone unknown", {} as Client)
    ).toThrow(
      new errors.InvalidScope("Invalid, unknown or malformed scope", "unknown")
    );
  });

  it("throws an Invalid Scope error for scopes not in client config", () => {
    jest.spyOn(Config.getInstance(), "getScopes").mockReturnValue(["openid"]);

    const mockContext = {
      URL: {
        searchParams: {
          get: (key: string) => {
            if (key === "scope") return "openid phone";
            else return null;
          },
        },
      },
    } as KoaContextWithOIDC;
    expect(() =>
      scopeValidator(mockContext, "openid phone", {} as Client)
    ).toThrow(
      new errors.InvalidScope("Invalid, unknown or malformed scope", "phone")
    );
  });

  it("does not throw when all request scopes are valid and in the client config", () => {
    jest.spyOn(Config.getInstance(), "getScopes").mockReturnValue(["openid"]);

    const mockContext = {
      URL: {
        searchParams: {
          get: (key: string) => {
            if (key === "scope") return "openid";
            else return null;
          },
        },
      },
    } as KoaContextWithOIDC;
    expect(() =>
      scopeValidator(mockContext, "openid phone", {} as Client)
    ).not.toThrow();
  });
});
