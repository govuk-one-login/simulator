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

export const VALID_LOC_VALUES = ["P0", "P1", "P2", "P3"];

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

//Not a secret! The simulator is a test product and this is used to sign dummy ID tokens it generates
export const RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDH7UWbqJkzVIR9KwHOLd3lQkMPEHY8/L3L1jTgvlaj1a8Hf3IRtFzD6Kj5jF2Ij6J66LoemcLg3JCed94LzW7jZPCwLJm/Ongq5R8GjFfoYKLRFupzbs4YBEzEBXLeutjQRI6AkJx4BauMoDyAs8Z5N2M6f62hCDHimk244XAGwLb9yMuQxW+2sX7M+Qt0uEDQxKqB+BJ7jmo8SAkFNDBGe2MJ/VvUQkN+dWG/6EC2wBW/tYzGlO6sSlQ7VDdFp0gAO+YvgaoFFXko0TzAukE/Yrxy9Q6cFiTRuIm+/0ZzQ0/MWQn/AHmZey/t2fsTFtRPu2zlzyxShKMjeqf1fxcRAgMBAAECggEAX/viN2EybBpfoVhMfZg3uCGf4FOe8JjG5l3o9R1sqyuj5I2jTiyxfLzuoyBop2+OKkQhVx+rGBnMtMgHqtLuMe38QBipl82Sc8Wcp6ApdD8w7AF8ff7so0stL88N3zEFdrfzUnYbKORQACvN4FxvJTMaSLOTwIQWrxw1xFU3W4XAWV0UGyYzaflyyoiRZlzEmBlP/TW/22qCH0jLkz7flLLf9SGZdNOZoHxFn63+vw6mNtK/PK+HsIlFW6X6UFwsPvBAVggIGmrxlgc5ZgIBwzxr2DBQJumKh3dgjS0NnNo8Xuz+jt1P6zClH8YT2oT/gZmLH7hlaf224z/2pqaWoQKBgQD133SIuVxoxJi98M2kUyo4kovr3EY4XXaydZnM0Eggat6gmlQJfYnCcF0AVUtWSqZ8UXWEp3AkBdGVEwonhq8EGDuK2TbNfbxqomgG40eoLAgKw0HpaiS60EUpdrV/5PMfX0R1NQNQ/3XN0P044Torxa39Fjou7abbZOTa7LrIxwKBgQDQKVmvJliSLB4d+MgsXP9D5CddahcoBWd5NbNrTJhVNwtPW0aGryMichdKFP1kbOb7N4BbT8azWPD8TV0VnhyMU48bCrg6bxwI2rI/ELYIiFYUhVt3R7wHQWs9W2EOI8L/mVSmhvrCmeLiAv7WG4dwUAxsBn1R/e7kT65CZzw5ZwKBgF1yTAwaxvBap+Kovr+RjB5sNBm0YkvR2ecBoy6gioknlO1dOktRFyZ7Jh2WTUfCn3voSc3dBVXrkDgkQFu9aI8Z1qdy3s1C2HV+vCLCBt33via5Bzf7S3Jk7aRQpbKyBWULBC23tEb4kIFkyJjxoPY572KdLAfh8uS3d/NsvaDJAoGASOeCkpZihOdQsPyV1vvHJ1b79nqWm5yw7cHCEf1kiMvbeTKlk7w5GPJOd9K8IHUHvMpmeRSKqfungyXxSQX0R61oPHdXqJeLgQpfTTkkF/7v7wX5z9/e2ceusHGVn2ck/3ILNLunjYpp7PBRollH6S0P/LGVKKdACNRjWrxfWlcCgYAIkua2Rz7M8gt/ZFB8cgaPl8Y4HYXgef8uaVDKKTliMlpLLxdPODfaSeYeOKHQma8fTH5XMm33/ZtDmF8Hdyc2js+OZzrOzobynlWl4i2Ahsss/ON0y93syWjyAWarDI6n5bsc9IfvcPPdtReHqRG5QwafdIEy+QhpBjx3mPw3pw==-----END PRIVATE KEY-----";

export const RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID =
  "5cdf2d21-3a7f-496a-bf00-74829f55d953";

//This is not a secret, this is the simulator's provider key used to sign ID tokens
export const EC_PRIVATE_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJx+BhLSXqIdFrPhFmAkifXysPRgVHCmyKi8DqMHH1XihRANCAAT/AhlQkClTY+FuaQUEoGvTMPaJq5IQY0HbItiGtjLEu18alBOIfHfW8BgjynlTmYvsdJ0+sJ80r14YDsbPBjNZ-----END PRIVATE KEY-----";

export const EC_PRIVATE_TOKEN_SIGNING_KEY_ID =
  "b9162667-e025-4d93-8c5b-e538e6c792ac";

//Not a secret! The simulator is a test product and this is used to sign dummy ID tokens it generates
export const EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY =
  "-----BEGIN PRIVATE KEY-----MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg9tf7MBsxMHind+Qybp5uCIQYH0UbUelnjUwE/7IXwhWhRANCAARVsV3TC+8AtEA3WCxwPTVq57Qq84ECllw8FVeqnCV1W5S1+7qSyGoywYQ9TPOTpKm2Geek936yEyYj7X4q7y+1-----END PRIVATE KEY-----";

export const EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID =
  "305e00b4-cfee-4966-bdab-1d8928a30e89";

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

export const AUTHORISE_ERRORS = ["ACCESS_DENIED", "TEMPORARILY_UNAVAILABLE"];

export const INVALID_ISSUER = "https://example.com/identity-provider";
export const ONE_DAY_IN_SECONDS = 86400;

export const VALID_CHANNELS = ["web", "generic_app"];
