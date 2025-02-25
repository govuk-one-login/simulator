import { createApp } from "../../src/app";
import request from "supertest";
import { Config } from "../../src/config";
import { base64url } from "jose";
import { randomUUID } from "crypto";
import { VALID_CLAIMS, VALID_SCOPES } from "../../src/constants";
import { exampleResponseConfig } from "./helper/test-constants";

const exampleConfig = exampleResponseConfig();

const validFormResponseConfig = {
  ...exampleConfig,
  coreIdentityVerifiableCredentials: JSON.stringify(
    exampleConfig.coreIdentityVerifiableCredentials
  ),
  passportDetails: JSON.stringify(exampleConfig.passportDetails),
  returnCodes: JSON.stringify(exampleConfig.returnCodes),
  postalAddressDetails: JSON.stringify(exampleConfig.postalAddressDetails),
  drivingPermitDetails: JSON.stringify(exampleConfig.drivingPermitDetails),
};
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

    const authCode = randomUUID();
    const state = randomUUID();
    const config = Config.getInstance();
    const encodedAuthRequestParams = base64url.encode(
      Buffer.from(JSON.stringify(authRequestParams))
    );

    const response = await request(app)
      .post("/form-submit")
      .send(
        new URLSearchParams({
          authCode,
          authRequestParams: encodedAuthRequestParams,
          state,
          ...validFormResponseConfig,
          emailVerified: "true",
          phoneNumberVerified: "true",
        } as any).toString()
      );

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual(
      `${redirectUri}?code=${authCode}&state=${state}`
    );

    const storedConfig = config.getAuthCodeRequestParams(authCode);
    expect(storedConfig).toStrictEqual({
      ...authRequestParams,
      responseConfiguration: exampleConfig,
    });
  });

  it.each([
    {
      responseConfig: {
        ...validFormResponseConfig,
        sub: "",
      },
      description: "no sub",
      invalid_fields: [
        {
          field: "sub",
          message: "Subject claim is a required field",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        emailVerified: "notStringBooly",
      },
      description: "invalid email verified",
      invalid_fields: [
        {
          field: "emailVerified",
          message: "Invalid value",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        maxLoCAchieved: "P99",
      },
      description: "invalid LOC",
      invalid_fields: [
        {
          field: "maxLoCAchieved",
          message: "Invalid Level of Confidence",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        coreIdentityVerifiableCredentials: JSON.stringify([]),
      },
      description: "invalid coreIdentity Verifiable Credential",
      invalid_fields: [
        {
          field: "coreIdentityVerifiableCredentials",
          message: "Invalid CoreIdentity Verifiable Credential",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        passportDetails: "{}",
      },
      description: "passport details not a JSON array",
      invalid_fields: [
        {
          field: "passportDetails",
          message: "Invalid Passport Details",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        drivingPermitDetails: "{}",
      },
      description: "driving permit details not a JSON array",
      invalid_fields: [
        {
          field: "drivingPermitDetails",
          message: "Invalid Driving Permit details",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        postalAddressDetails: "{}",
      },
      description: "postal address details not a JSON array",
      invalid_fields: [
        {
          field: "postalAddressDetails",
          message: "Invalid Postal Address details",
        },
      ],
    },
    {
      responseConfig: {
        ...validFormResponseConfig,
        returnCodes: "{}",
      },
      description: "return codes not a JSON array",
      invalid_fields: [
        {
          field: "returnCodes",
          message: "Invalid Return Codes",
        },
      ],
    },
  ])(
    "it returns a 400 and invalid error message for $description",
    async (params) => {
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

      const authCode = randomUUID();
      const state = randomUUID();
      const encodedAuthRequestParams = base64url.encode(
        Buffer.from(JSON.stringify(authRequestParams))
      );

      const response = await request(app)
        .post("/form-submit")
        .send(
          new URLSearchParams({
            ...params.responseConfig,
            authCode,
            authRequestParams: encodedAuthRequestParams,
            state,
          } as any).toString()
        );

      expect(response.status).toEqual(400);
      expect(response.body).toStrictEqual({
        error: "Invalid request",
        invalid_fields: params.invalid_fields,
      });
    }
  );
});
