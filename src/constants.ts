import { UserIdentityClaim } from "./types/user-info";

export const VALID_SCOPES = ["openid", "email", "phone"];

export const VALID_CLAIMS: UserIdentityClaim[] = [
  "https://vocab.account.gov.uk/v1/passport",
  "https://vocab.account.gov.uk/v1/address",
  "https://vocab.account.gov.uk/v1/drivingPermit",
  "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  "https://vocab.account.gov.uk/v1/returnCode",
];

export const VALID_CREDENTIAL_TRUST_VALUES = ["Cl", "Cl.Cm"];

export const VALID_LOC_VALUES = ["P0", "P1", "P2"];

export const NON_IDENTITY_LOC_VALUES = ["P0", null];

export const VALID_TOKEN_SIGNING_ALGORITHMS = ["ES256", "RS256"];

//Whilst we don't support all of these we do need to reject
//requests with invalid prompt values.
export const VALID_OIDC_PROMPTS = [
  "none",
  "login",
  "consent",
  "select_account",
  "create",
];

//We only support the code response_type, but
// we need to reject invalid ones
export const VALID_OIDC_RESPONSE_TYPES = ["token", "code", "id_token"];

export const SUPPORTED_UI_LOCALES = ["en", "cy", "cy-AR"];

export const ACCESS_TOKEN_EXPIRY = 180; //3 Minutes
export const ID_TOKEN_EXPIRY = 120; //2  Minutes
//We currently use a static session id for the access and id tokens.
//We can fix this later
export const SESSION_ID = "50a9041b5d57cb53632a0e9259864b71";

//This is not a secret, this is the simulator's provider key used to sign tokens
export const RSA_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCwNMZ2+cMY7xoSiiEAR8IBpL/uN5u7gM0mkc47Q9W+CDHpKfmSRmZZao6/lE0Y7wI5HcXBTkYf2gyPSK4SWa0uE+EiyHyfx94LcItof+aNjSgckJ7Yv4taG0ipOfhHpZ3x9kJ51KZmdoTmpbMtxIEqUPQCi6gXulOjWQFIoPa7rJMRrTUInfMAYyrScvZvYu2iwrZZhyLkpr6NQXVDbSqU5HV9iTBDrJNwdgcqMX1CrZIMXCXKD4Ji2E2Ki6Xl3xMWDmQVudAkwk7I8FCfRdXnxTZd2K0Nr1Y3Bc1kaFqCsexwmFqUP0aqDNYHmMctBCPm9Z3j7GzqPzUPp0udY6HAgMBAAECggEAVJVpuffrg9KHYCYhLZ/NCe/NBVqV5MjjxINi/oLbIDMZDYxiTZ6fCyQACKouu5m7b4NGg82FbDHdn8A0paRfgorwIklJP6hdkxUQmkAbIq97MNofLLakXTVW/O5xNTFTOYenKGl60vJiqBQCfbvfC/410ROzB3zhSHgZIi/I45r4/EDQuKXcSBfszKDQ8+uVhXHv0Ck7ny+fEXxgfgm7v0PEwlHvBBbig7fAdxBefwdgaXQMRtDiJBbjIYTm8OpynjCENd3jRmuR2qAErt1mCEDg/OaHzWV+LDffOg1DBACjzIlJ5ltE+VPRy17x6lj1KOrgUGRLqsLAst9y5f/bxQKBgQDkjSFEBXymIZBIAwCNdGnqMMqmotNB5hjxupbRL+atvsQ3wabPpp8rL3aRrjVydDPHmLS6iQx6C8tV0tFUP6lkRJ17nmqcw8+kyJZ7q0QfwoG+Vegm3lqlcnnkJm9YUe2uWeZpCnjlzlaDVNCK+MMZ2lZGb1NflT34VvWqelygnQKBgQDaJJBpJQni+HoQtSs/g3AsgY+K+MoEHksqG9TabWWStFv7idLMgKhWWiIQJmRrCpseU/8N5DjaPPEL0hSiS28VzGdsNXU37O7ZSnr3YVIms1bzgFABF4bOr+SoVQ2d5DndDztsgNdrARGAPoOFsvEt80DdncS6NKEfBBgk8b6IcwKBgQCtfUQHMnMQWOIBB+ZfekL79tWd8HOUzmmY9R6O5GGi+fBQsrtBXSXtzjWfGDKSEwtLM+vcvTOvYUyUdVdZMIoRBtTUhcg//5Obbnhsn/Eyep+qL+PtvVPpyyAjw9k5nddiRfPVQJHNP/gD8VnsZDEVatua097h65QC81/AbOnrMQKBgD9VDEQqh7NIto+xOYwoCeIx/022q1gEv4fLKsH7rtin2mit+/B5jeX8JxWPP+o/2wc0FcGft83MkaL/7BOuWOL4RDKLVqvU8wdM82Rs8d/gg2cQoqmeffn14Snp/5kOkKoYaQU4ZtJfLgiQnbisWg8gJ33v9xSkgP6zPptDQDD3AoGBAKEqpxhCf7jpae5t1KJUupHjrB2Lb0bV7p8U7FiX9NObmyWuVMBRWYYEBe1QkXlmsOM4EMlvaUJZYXPvB52w5mT2FX6Ve6bqpY7T0VxbLBKwAIXTigxvUZuIfkXbhreR/PPCjrjifQr0SAZZjedmykg1vHJB4wIHJNOzE+GsmhgO-----END PRIVATE KEY-----";
export const RSA_PRIVATE_TOKEN_SIGNING_KEY_ID =
  "7334b718-3f29-44ef-8b65-e266a17daea5";

//This is not a secret, this is the simulator's provider key used to sign tokens
export const EC_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJx+BhLSXqIdFrPhFmAkifXysPRgVHCmyKi8DqMHH1XihRANCAAT/AhlQkClTY+FuaQUEoGvTMPaJq5IQY0HbItiGtjLEu18alBOIfHfW8BgjynlTmYvsdJ0+sJ80r14YDsbPBjNZ-----END PRIVATE KEY-----";
export const EC_PRIVATE_TOKEN_SIGNING_KEY_ID =
  "b9162667-e025-4d93-8c5b-e538e6c792ac";

//This is not a secret, this is the simulator's provider key used to sign Core /
export const EC_PRIVATE_IDENTITY_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnBxb1WWoNKtXS/pnnRph4glqBn/hTPFc2c1F7GZZhhahRANCAAR2AfemUlLT0eo678AxK4eGWxpkk99fi5pV+i2udqcGyVRhqBBwUNfsjrH03d8zGuA5y0yae15ijY1Zg7ePAnME-----END PRIVATE KEY-----";
export const EC_PRIVATE_IDENTITY_SIGNING_KEY_ID =
  "1f1caabb-b0bb-45b2-93ee-f47bf098dc1d";

export const CORE_IDENTITY_ERRORS = [
  "INVALID_ALG_HEADER",
  "INVALID_SIGNATURE",
  "INVALID_ISS",
  "INVALID_AUD",
  "INCORRECT_SUB",
  "TOKEN_EXPIRED",
];

export const ID_TOKEN_ERRORS = [
  "INVALID_ISS",
  "INVALID_AUD",
  "INVALID_ALG_HEADER",
  "INVALID_SIGNATURE",
  "TOKEN_EXPIRED",
  "TOKEN_NOT_VALID_YET",
  "NONCE_NOT_MATCHING",
  "INCORRECT_VOT",
];

export const AUTHORISE_ERRORS = ["ACCESS_DENIED"];

export const INVALID_ISSUER = "https://example.com/identity-provider";
export const ONE_DAY_IN_SECONDS = 86400;
