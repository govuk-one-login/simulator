import { createApp } from "../../src/app";
import request from "supertest";
import { Config } from "../../src/config";
import { base64url } from "jose";
import { randomUUID } from "crypto";
import { VALID_CLAIMS, VALID_SCOPES } from "../../src/constants";

const VERIFIABLE_CREDENTIAL = {
  type: ["VerifiableCredential"],
  credentialSubject: {
    name: [
      {
        nameParts: [
          {
            value: "John",
            type: "GivenName",
          },
          {
            value: "Smith",
            type: "FamilyName",
            validUntil: "1999-12-31",
          },
          {
            value: "Jones",
            type: "FamilyName",
            validFrom: "2000-01-01",
          },
        ],
      },
    ],
    birthDate: [
      {
        value: "1980-01-01",
      },
    ],
  },
};
const RETURN_CODE = [{ code: "example_code" }];
const SUB_CLAIM =
  "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
const EMAIL = "example@example.com";
const EMAIL_VERIFIED = "true";
const PHONE_NUMBER = "07123456789";
const PHONE_NUMBER_VERIFIED = "true";
const LOC_ACHIEVED = "P2";
const PASSPORT_DETAILS = [
  {
    expiryDate: "2032-02-02",
    icaoIssuerCode: "GBR",
    documentNumber: "1223456",
  },
];
const DRIVING_PERMIT_DETAILS = [
  {
    example: "1234567",
  },
];
const POSTAL_ADDRESS_DETAILS = [
  {
    example: "1234567",
  },
];

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

    const responseConfig = {
      sub: SUB_CLAIM,
      email: EMAIL,
      emailVerified: EMAIL_VERIFIED,
      phoneNumber: PHONE_NUMBER,
      phoneNumberVerified: PHONE_NUMBER_VERIFIED,
      maxLoCAchieved: LOC_ACHIEVED,
      coreIdentityVerifiableCredentials: VERIFIABLE_CREDENTIAL,
      passportDetails: PASSPORT_DETAILS,
      drivingPermitDetails: DRIVING_PERMIT_DETAILS,
      postalAddressDetails: POSTAL_ADDRESS_DETAILS,
      returnCodes: RETURN_CODE,
    };

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
        ...responseConfig,
      });

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual(
      `${redirectUri}?code=${authCode}&state=${state}`
    );

    const storedConfig = config.getAuthCodeRequestParams(authCode);
    expect(storedConfig).toStrictEqual({
      ...authRequestParams,
      responseConfiguration: {
        ...responseConfig,
        emailVerified: responseConfig.emailVerified === "true",
        phoneNumberVerified: responseConfig.phoneNumberVerified === "true",
      },
    });
  });
});
