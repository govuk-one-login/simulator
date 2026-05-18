import { ensureLegalRedirectURI } from "../validate-redirectUri.js";

describe("Validate RedirectUri tests", () => {
  it("should not throw if the redirectUri is legal", () => {
    const validRedirectUri = new URL(
      "https://test.com/params?testParam1=param1&testParam2=param2"
    );

    expect(() => ensureLegalRedirectURI(validRedirectUri)).not.toThrow();
  });

  it("should throw if the url scheme is invalid", () => {
    const invalidUrlSchemeRedirectUri = new URL("javascript:testJavaScript");

    expect(() => ensureLegalRedirectURI(invalidUrlSchemeRedirectUri)).toThrow(
      new Error("The URI scheme javascript is prohibited")
    );
  });

  it("should throw if the query param name is invalid", () => {
    const invalidQueryParamNameRedirectUrl = new URL(
      "https://test.com/params?code=invalidParam&testParam2=param2"
    );

    expect(() =>
      ensureLegalRedirectURI(invalidQueryParamNameRedirectUrl)
    ).toThrow(new Error("The query parameter code is prohibited"));
  });
});
