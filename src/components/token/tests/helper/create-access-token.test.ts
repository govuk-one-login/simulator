jest.mock("crypto", () => ({
  randomUUID: () => "1234567",
}));

import { Config } from "../../../../config";
import {
  ACCESS_TOKEN_EXPIRY,
  EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
  SESSION_ID,
  VALID_CLAIMS,
} from "../../../../constants";
import { VectorOfTrust } from "../../../../types/vector-of-trust";
import { createAccessToken } from "../../helper/create-access-token";

describe("createAccessToken tests", () => {
  const testTimestamp = 1723707024;
  const testClientId = "testClientId";
  const testSubClaim =
    "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";

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

  test.each<{
    tokenSigningAlgorithm: "RS256" | "ES256";
    expectedKeyId: string;
  }>([
    {
      tokenSigningAlgorithm: "RS256",
      expectedKeyId: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
    },
    {
      tokenSigningAlgorithm: "ES256",
      expectedKeyId: EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
    },
  ])(
    "returns a signed jwt using $tokenSigningAlgorithm",
    async ({ tokenSigningAlgorithm, expectedKeyId }) => {
      const vtr: VectorOfTrust = {
        credentialTrust: "Cl.Cm",
        levelOfConfidence: "P2",
      };
      tokenSigningAlgorithmSpy.mockReturnValue(tokenSigningAlgorithm);
      subSpy.mockReturnValue(testSubClaim);
      clientIdSpy.mockReturnValue(testClientId);

      const accessToken = await createAccessToken(
        ["openid"],
        vtr,
        VALID_CLAIMS
      );
      const tokenParts = accessToken.split(".");

      const header = decodeTokenPart(tokenParts[0]);
      const payload = decodeTokenPart(tokenParts[1]);

      expect(tokenParts.length).toBe(3);
      expect(header).toStrictEqual({
        alg: tokenSigningAlgorithm,
        kid: expectedKeyId,
      });
      expect(payload).toStrictEqual({
        iat: Math.floor(testTimestamp / 1000),
        exp: Math.floor(testTimestamp / 1000) + ACCESS_TOKEN_EXPIRY,
        iss: "http://localhost:3000/",
        jti: "1234567",
        client_id: testClientId,
        sub: testSubClaim,
        sid: SESSION_ID,
        scope: ["openid"],
        claims: VALID_CLAIMS,
      });
      expect(typeof tokenParts[2]).toBe("string");
    }
  );

  it("does not contain any claims if no claims were given", async () => {
    const vtr: VectorOfTrust = {
      credentialTrust: "Cl.Cm",
      levelOfConfidence: "P2",
    };
    const accessToken = await createAccessToken(["openid"], vtr, null);
    const tokenParts = accessToken.split(".");

    const payload = decodeTokenPart(tokenParts[1]);

    expect(payload).not.toHaveProperty("claims");
  });

  it("does not contain any claims if level of confidence is null", async () => {
    const vtr: VectorOfTrust = {
      credentialTrust: "Cl",
      levelOfConfidence: null,
    };
    const accessToken = await createAccessToken(["openid"], vtr, VALID_CLAIMS);
    const tokenParts = accessToken.split(".");

    const payload = decodeTokenPart(tokenParts[1]);

    expect(payload).not.toHaveProperty("claims");
  });
});
