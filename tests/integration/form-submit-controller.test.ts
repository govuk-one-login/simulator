import { createApp } from "../../src/app";
import request from "supertest";
import { Config } from "../../src/config";
import { base64url } from "jose";
import { randomUUID } from "crypto";
import { VALID_CLAIMS, VALID_SCOPES } from "../../src/constants";
import { exampleResponseConfig } from "./helper/test-constants";
describe("FormSubmit controller tests", () => {
  it("stores the auth request params alongside the response config and redirects", async () => {
    const app = createApp();

    const redirectUri = "http://example.com/authentication-callback";
    const authRequestParams = {
      nonce: randomUUID(),
      redirectUri,
      scopes: VALID_SCOPES,
      claims: VALID_CLAIMS,
      vtr: {
        credentialTrust: "Cl.Cm",
        levelOfConfidence: "P2",
      },
    };

    const responseConfiguration = exampleResponseConfig();

    const authCode = randomUUID();
    const state = randomUUID();
    const config = Config.getInstance();
    const encodedAuthRequestParams = base64url.encode(
      Buffer.from(JSON.stringify(authRequestParams))
    );

    const response = await request(app)
      .post("/form-submit")
      .send({
        authCode,
        authRequestParams: encodedAuthRequestParams,
        state,
        ...responseConfiguration,
        emailVerified: "true",
        phoneNumberVerified: "true",
      });

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual(
      `${redirectUri}?code=${authCode}&state=${state}`
    );

    const storedConfig = config.getAuthCodeRequestParams(authCode);
    expect(storedConfig).toStrictEqual({
      ...authRequestParams,
      responseConfiguration,
    });
  });
});
