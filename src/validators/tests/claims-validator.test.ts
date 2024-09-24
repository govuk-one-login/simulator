import { Config } from "../../config";
import { ReturnCodeError } from "../../errors/return-code-error";
import { areClaimsValid, checkForReturnCode } from "../claims-validator";

describe("claims validation tests", () => {
  let config: Config;
  let claimsSpy: jest.SpyInstance;

  beforeAll(() => {
    config = Config.getInstance();
    claimsSpy = jest.spyOn(config, "getClaims");
  });

  describe("claims valid test", () => {
    it("returns true if the claims are empty", () => {
      claimsSpy.mockReturnValue([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
      ]);

      expect(areClaimsValid([], config)).toBe(true);
    });

    it("returns false for unknown claims", () => {
      claimsSpy.mockReturnValue([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
      ]);

      expect(
        areClaimsValid(["https://vocab.account.gov.uk/v1/unknownClaim"], config)
      ).toBe(false);
    });

    it("returns false if the claims are not supported by the client", () => {
      claimsSpy.mockReturnValue([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
      ]);

      expect(
        areClaimsValid(["https://vocab.account.gov.uk/v1/returnCode"], config)
      ).toBe(false);
    });

    it("returns true if all the claims are known and supported by the client", () => {
      claimsSpy.mockReturnValue([
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/returnCode",
      ]);

      expect(
        areClaimsValid(
          [
            "https://vocab.account.gov.uk/v1/coreIdentityJWT",
            "https://vocab.account.gov.uk/v1/returnCode",
          ],
          config
        )
      ).toBe(true);
    });
  });

  describe("Return Code check tests", () => {
    const redirectUri = "https://testUri";
    const returnCode = { code: "PLACEHOLDER" };

    let returnCodesSpy: jest.SpyInstance;

    beforeAll(() => {
      returnCodesSpy = jest.spyOn(config, "getReturnCode");
    });

    it("should throw an error with the return code when it is requested in the response and in the claim", () => {
      returnCodesSpy.mockReturnValue(returnCode);

      expect(() =>
        checkForReturnCode(
          config,
          ["https://vocab.account.gov.uk/v1/returnCode"],
          redirectUri
        )
      ).toThrow(
        new ReturnCodeError(`Return Code: ${returnCode.code}`, redirectUri)
      );
    });

    it("should throw an error when return code exists but does not exist in claim", () => {
      returnCodesSpy.mockReturnValue(returnCode);

      expect(() => checkForReturnCode(config, [], redirectUri)).toThrow(
        new ReturnCodeError(
          "Access Denied: Not requested to view return code",
          redirectUri
        )
      );
    });
  });
});
