import { Config } from "../../../../config";
import {
  ID_TOKEN_EXPIRY,
  EC_KEY_ID,
  ISSUER_VALUE,
  RSA_KEY_ID,
  TRUSTMARK_URL,
  SESSION_ID,
} from "../../../../constants";
import AuthRequestParameters from "../../../../types/auth-request-parameters";
import { createIdToken } from "../../helper/create-id-token";

describe("createIdToken tests", () => {
  const mockAuthRequestParams: AuthRequestParameters = {
    claims: [],
    nonce: "nonce-1238rhbh4r84=4rij=r4r",
    scopes: ["openid"],
    redirectUri: "https://example.com/authentication-callback/",
    vtr: {
      credentialTrust: "Cl.Cm",
      levelOfConfidence: null,
    },
  };
  const testTimestamp = 1723707024;
  const testClientId = "testClientId";
  const testSubClaim =
    "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
  const testAccessToken =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjczMzRiNzE4LTNmMjktNDRlZi04YjY1LWUyNjZhMTdkYWVhNSJ9.eyJleHAiOjkzNjQ4OTc4MSwiaWF0Ijo5MzY0ODk2MDEsImlzcyI6Imh0dHBzOi8vb2lkYy50ZXN0LmFjY291bnQuZ292LnVrIiwianRpIjoiMTIzNDU2NyIsImNsaWVudF9pZCI6InRlc3RDbGllbnRJZCIsInN1YiI6InVybjpmZGM6Z292LnVrOjIwMjI6NTZQNENNc0doXzAyWU9sV3BkOFBBT0ktMnNWbEIybnNOVTdtY0xaWWhZdz0iLCJzaWQiOiIxMjM0NTY3Iiwic2NvcGUiOlsib3BlbmlkIl19.GDDz3DcWSUCWMT8OkxZvU8ffiAjOKcNNaW23RzlEBer3G4Xz5Sp7moGtbP4vcfXT_pLUy-_YTIsiJ9r-A1gchhmx_qbfnWcqHxwj3DFYZ_Q16XgpB_7o_MtsiY1aAhqd8-zywTg25aczMHPtZMLVdYx9vw8zlF9iI9sOscS-s5Bje1yZ6ZmbHseHYVa8yJmZIjoKcdnGQXQwGQFp1KyzkA2gJxnR19Nc8O9oM4PA5y6uBCme3YTknei3T3tfJrPiBevtdvr9SV5fBTK2MrPzHao51_8nT841TdnMbHWxYp0FHTiBw7aAQO2VoKQ6Zku5CqBd3dyeQy_sZDNOFrDOTA";

  const clientIdSpy = jest.spyOn(Config.getInstance(), "getClientId");
  const subSpy = jest.spyOn(Config.getInstance(), "getSub");
  const tokenSigningAlgorithmSpy = jest.spyOn(
    Config.getInstance(),
    "getIdTokenSigningAlgorithm"
  );

  const decodeTokenPart = (part: string) =>
    JSON.parse(Buffer.from(part, "base64url").toString());

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(testTimestamp);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns a signed Id token using RS256", async () => {
    tokenSigningAlgorithmSpy.mockReturnValue("RS256");
    subSpy.mockReturnValue(testSubClaim);
    clientIdSpy.mockReturnValue(testClientId);

    const IdToken = await createIdToken(mockAuthRequestParams, testAccessToken);
    const tokenParts = IdToken.split(".");

    const header = decodeTokenPart(tokenParts[0]);
    const payload = decodeTokenPart(tokenParts[1]);

    expect(tokenParts.length).toBe(3);
    expect(header).toStrictEqual({
      alg: "RS256",
      kid: RSA_KEY_ID,
    });
    expect(payload).toStrictEqual({
      iat: Math.floor(testTimestamp / 1000),
      exp: Math.floor(testTimestamp / 1000) + ID_TOKEN_EXPIRY,
      iss: ISSUER_VALUE,
      aud: testClientId,
      sub: testSubClaim,
      sid: SESSION_ID,
      at_hash: "oB7bgQoIL9clDcgMdS4Ydg",
      vtm: TRUSTMARK_URL,
      vot: "Cl.Cm",
      nonce: mockAuthRequestParams.nonce,
    });
    expect(typeof tokenParts[2]).toBe("string");
  });

  it("returns a signed Id Token using ES256", async () => {
    tokenSigningAlgorithmSpy.mockReturnValue("ES256");
    subSpy.mockReturnValue(testSubClaim);
    clientIdSpy.mockReturnValue(testClientId);

    const idToken = await createIdToken(mockAuthRequestParams, testAccessToken);
    const tokenParts = idToken.split(".");

    const header = decodeTokenPart(tokenParts[0]);
    const payload = decodeTokenPart(tokenParts[1]);

    expect(tokenParts.length).toBe(3);
    expect(header).toStrictEqual({
      alg: "ES256",
      kid: EC_KEY_ID,
    });
    expect(payload).toStrictEqual({
      iat: Math.floor(testTimestamp / 1000),
      exp: Math.floor(testTimestamp / 1000) + ID_TOKEN_EXPIRY,
      iss: ISSUER_VALUE,
      aud: testClientId,
      sub: testSubClaim,
      sid: SESSION_ID,
      at_hash: "oB7bgQoIL9clDcgMdS4Ydg",
      vtm: TRUSTMARK_URL,
      vot: mockAuthRequestParams.vtr.credentialTrust,
      nonce: mockAuthRequestParams.nonce,
    });
    expect(typeof tokenParts[2]).toBe("string");
  });
});
