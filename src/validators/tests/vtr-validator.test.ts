import { Config } from "../../config";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { vtrValidator } from "../vtr-validator";

describe("vtrValidator tests", () => {
  const config = Config.getInstance();

  const levelOfConfidenceSpy = jest.spyOn(config, "getClientLoCs");
  const state = "4063a64d651d9077adee7c51a26e87e8";
  const redirectUri = "https://example.com/authentication-callback";

  it("returns the default credential trust and level of confidence when vtr is undefined", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(vtrValidator(undefined, config, state, redirectUri)).toStrictEqual([
      {
        levelOfConfidence: null,
        credentialTrust: "Cl.Cm",
      },
    ]);
  });

  it("throws an error when a vtr includes more than 1 identity component", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2.P0"]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("ignores any unknown values", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(
      vtrValidator('["Cl.Cm.P2.D4"]', config, state, redirectUri)
    ).toStrictEqual([
      {
        credentialTrust: "Cl.Cm",
        levelOfConfidence: "P2",
      },
    ]);
  });

  it("throws an error when a vtr includes an unsupported credential trust value", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() => vtrValidator('["Ch.P2"]', config, state, redirectUri)).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr includes an invalid level of identity confidence", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P3"]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr specified P2 confidence with an credential trust value of Cl", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() => vtrValidator('["Cl.P2"]', config, state, redirectUri)).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr specified P1 confidence with an credential trust value of Cl", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P1", "P2"]);

    expect(() => vtrValidator('["Cl.P1"]', config, state, redirectUri)).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr set includes both identity and non identity components", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2", "Cl.Cm"]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr set includes levels of identity confidence not supported by the client", () => {
    levelOfConfidenceSpy.mockReturnValue(["P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2", "Cl.Cm.P0"]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("throws an error when a vtr set is an invalid JSON array", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2", "Cl.Cm.P0"]]]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("does not allow both identity and non-identity components in the vtr with a P0", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2", "Cl.Cm.P0"]]]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("does not allow both identity and non-identity implicitly", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0", "P2"]);

    expect(() =>
      vtrValidator('["Cl.Cm.P2", "Cl.Cm"]]]', config, state, redirectUri)
    ).toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request vtr not valid",
        httpStatusCode: 302,
        state,
        redirectUri,
      })
    );
  });

  it("returns a parsed valid vtr set", () => {
    levelOfConfidenceSpy.mockReturnValue(["P1", "P2"]);

    expect(
      vtrValidator('["Cl.Cm.P2", "Cl.Cm.P1"]', config, state, redirectUri)
    ).toStrictEqual([
      {
        levelOfConfidence: "P2",
        credentialTrust: "Cl.Cm",
      },
      {
        levelOfConfidence: "P1",
        credentialTrust: "Cl.Cm",
      },
    ]);
  });

  it("allows P0 with any credential trust level", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0"]);

    expect(
      vtrValidator('["Cl.Cm.P0", "Cl.P0"]', config, state, redirectUri)
    ).toStrictEqual([
      {
        levelOfConfidence: "P0",
        credentialTrust: "Cl.Cm",
      },
      {
        levelOfConfidence: "P0",
        credentialTrust: "Cl",
      },
    ]);
  });

  it("handles an omitted LOC but any credential trust", () => {
    levelOfConfidenceSpy.mockReturnValue(["P0"]);

    expect(
      vtrValidator('["Cl.Cm", "Cl"]', config, state, redirectUri)
    ).toStrictEqual([
      {
        levelOfConfidence: null,
        credentialTrust: "Cl.Cm",
      },
      {
        levelOfConfidence: null,
        credentialTrust: "Cl",
      },
    ]);
  });
});
