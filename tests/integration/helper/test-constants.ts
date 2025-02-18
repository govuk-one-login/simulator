import ResponseConfiguration from "../../../src/types/response-configuration";

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
const EMAIL_VERIFIED = true;
const PHONE_NUMBER = "07123456789";
const PHONE_NUMBER_VERIFIED = true;
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

export const exampleResponseConfig = (): ResponseConfiguration => ({
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
});
