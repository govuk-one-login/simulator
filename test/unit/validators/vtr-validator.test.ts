import { jest } from "@jest/globals";
import { vtrValidator } from "../../../src/validators/vtr-validator.js";
import { Config } from "../../../src/config";
import { Client, errors, KoaContextWithOIDC } from "oidc-provider";
import { logger } from "../../../src/logger.js";

describe("vtrValidator tests", () => {
  beforeEach(() => {
    jest.spyOn(logger, "error");
    jest.spyOn(logger, "info");
  });

  const idVerificationSupportSpy = jest.spyOn(
    Config.getInstance(),
    "getIdentityVerificationSupported"
  );

  const levelsOfConfidenceSpy = jest.spyOn(
    Config.getInstance(),
    "getClientLoCs"
  );

  const mockContext = {
    oidc: {
      params: {},
    },
  } as KoaContextWithOIDC;

  const mockClient = {
    clientId: "client_id_12345",
  } as Client;

  it("uses the default vtr value Cl.Cm when no vtr is provided", () => {
    expect(() =>
      vtrValidator(mockContext, undefined, mockClient)
    ).not.toThrow();
    expect(logger.info).toHaveBeenCalledWith(
      "Vtr not present, replacing with default"
    );
    expect(
      (mockContext.oidc.params as Record<string, unknown>).vtr
    ).toStrictEqual(
      JSON.stringify([{ CredentialTrust: "Cl.Cm", LevelOfConfidence: null }])
    );
  });

  it("throws an invalid_request error when vtr is invalid JSON", () => {
    expect(() => vtrValidator(mockContext, '["Cl', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    expect(logger.error).toHaveBeenCalledWith("Error parsing VTR");
  });

  it("does not throw if provided credential trust Cl and no level of Confidence provided", () => {
    expect(() => vtrValidator(mockContext, '["Cl"]', mockClient)).not.toThrow();
  });

  it("does not throw if provided credential trust Cl.Cm and no level of Confidence provided", () => {
    expect(() =>
      vtrValidator(mockContext, '["Cl.Cm"]', mockClient)
    ).not.toThrow();
  });

  it("sorts the value and does not throw an error if the credential trust is specified out of order", () => {
    expect(() =>
      vtrValidator(mockContext, '["Cm.Cl"]', mockClient)
    ).not.toThrow();

    expect(
      (mockContext.oidc.params as Record<string, unknown>).vtr
    ).toStrictEqual(
      JSON.stringify([{ CredentialTrust: "Cl.Cm", LevelOfConfidence: null }])
    );
  });

  it("does not throw if provided multiple valid credential trust values", () => {
    expect(() =>
      vtrValidator(mockContext, '["Cl.Cm","Cl"]', mockClient)
    ).not.toThrow();
  });

  it("does not throw if provided multiple valid vtr combinations", () => {
    levelsOfConfidenceSpy.mockReturnValue(["P0", "P2"]);
    idVerificationSupportSpy.mockReturnValue(true);
    expect(() =>
      vtrValidator(mockContext, '["Cl.Cm.P2","Cl.P0"]', mockClient)
    ).not.toThrow();
  });

  it("does not throw if provided credential trust Cl.Cm and P2 level of confidence with valid client config", () => {
    levelsOfConfidenceSpy.mockReturnValue(["P2"]);
    idVerificationSupportSpy.mockReturnValue(true);
    expect(() =>
      vtrValidator(mockContext, '["Cl.Cm.P2"]', mockClient)
    ).not.toThrow();
  });

  it("throws an error if provided invalid credential trust level", () => {
    expect(() => vtrValidator(mockContext, '["Cl.Cm.Ch"]', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    logger.error(
      "Invalid Credential trust values present in Vtr",
      '["Cl.Cm.Ch"]'
    );
  });

  it("throws an error if provided invalid level of confidence", () => {
    expect(() => vtrValidator(mockContext, '["Cl.Cm.P4"]', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Invalid Level of confidence value requested: ",
      "P4"
    );
  });

  it("throws an error if provided level of confidence is not in client config", () => {
    levelsOfConfidenceSpy.mockReturnValue(["P0"]);
    expect(() => vtrValidator(mockContext, '["Cl.Cm.P2"]', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    expect(logger.error).toHaveBeenCalledWith(
      "VTR contains identity vectors not present in client configuration"
    );
  });

  it("throws an error if the request includes P2 LOC but identity verification is not supported", () => {
    levelsOfConfidenceSpy.mockReturnValue(["P2"]);
    idVerificationSupportSpy.mockReturnValue(false);
    expect(() => vtrValidator(mockContext, '["Cl.Cm.P2"]', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Client has included identity vectors with identity verification not supported"
    );
  });

  it("throws an error if the request includes P2 LOC with credential trust of Cl", () => {
    levelsOfConfidenceSpy.mockReturnValue(["P2"]);
    idVerificationSupportSpy.mockReturnValue(true);
    expect(() => vtrValidator(mockContext, '["Cl.P2"]', mockClient)).toThrow(
      new errors.InvalidRequest("Request vtr not valid", 302)
    );
    expect(logger.error).toHaveBeenCalledWith(
      "P2 identity confidence must require at least Cl.Cm credential trust"
    );
  });
});
