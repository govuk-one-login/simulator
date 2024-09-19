import { createApp } from "../../../app";
import request from "supertest";
import { Config } from "../../../config";

const TEST_CLIENT_ID = "test-id";
const TEST_PUBLIC_KEY = "test-public-key";
const TEST_SCOPES = ["scope1", "scope2"];
const TEST_REDIRECT_URLS = ["http://redirect-url"];
const TEST_CLAIMS = ["claim1", "claim2"];
const TEST_IDENTITY_VERIFICATION_SUPPORTED = false;
const TEST_ID_TOKEN_SIGNING_ALGORITHM = "RS256";
const TEST_CLIENT_LOCS = ["PCL200"];
const TEST_SUB = "test-sub";
const TEST_EMAIL = "test@gmail.com";
const TEST_EMAIL_VERIFIED = false;
const TEST_PHONE_NUMBER = "07777777777";
const TEST_PHONE_NUMBER_VERIFIED = false;

describe("Integration: Config POST", () => {
  afterEach(() => {
    Config.resetInstance();
  });

  test("Config is set by call to endpoint", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({
        clientConfiguration: {
          clientId: TEST_CLIENT_ID,
          publicKey: TEST_PUBLIC_KEY,
          scopes: TEST_SCOPES,
          redirectUrls: TEST_REDIRECT_URLS,
          claims: TEST_CLAIMS,
          identityVerificationSupported: TEST_IDENTITY_VERIFICATION_SUPPORTED,
          idTokenSigningAlgorithm: TEST_ID_TOKEN_SIGNING_ALGORITHM,
          clientLoCs: TEST_CLIENT_LOCS,
        },
        responseConfiguration: {
          sub: TEST_SUB,
          email: TEST_EMAIL,
          emailVerified: TEST_EMAIL_VERIFIED,
          phoneNumber: TEST_PHONE_NUMBER,
          phoneNumberVerified: TEST_PHONE_NUMBER_VERIFIED,
        },
        errorConfiguration: {
          coreIdentityErrors: ["INVALID_ALG_HEADER"],
          idTokenErrors: ["INVALID_ISS"],
        },
      });
    expect(response.status).toEqual(200);

    const config = Config.getInstance();

    expect(config.getClientId()).toEqual(TEST_CLIENT_ID);
    expect(config.getPublicKey()).toEqual(TEST_PUBLIC_KEY);
    expect(config.getScopes()).toEqual(TEST_SCOPES);
    expect(config.getRedirectUrls()).toEqual(TEST_REDIRECT_URLS);
    expect(config.getClaims()).toEqual(TEST_CLAIMS);
    expect(config.getIdentityVerificationSupported()).toEqual(
      TEST_IDENTITY_VERIFICATION_SUPPORTED
    );
    expect(config.getIdTokenSigningAlgorithm()).toEqual(
      TEST_ID_TOKEN_SIGNING_ALGORITHM
    );
    expect(config.getClientLoCs()).toEqual(TEST_CLIENT_LOCS);
    expect(config.getSub()).toEqual(TEST_SUB);
    expect(config.getEmail()).toEqual(TEST_EMAIL);
    expect(config.getEmailVerified()).toEqual(TEST_EMAIL_VERIFIED);
    expect(config.getPhoneNumber()).toEqual(TEST_PHONE_NUMBER);
    expect(config.getPhoneNumberVerified()).toEqual(TEST_PHONE_NUMBER_VERIFIED);
    expect(config.getCoreIdentityErrors()).toStrictEqual([
      "INVALID_ALG_HEADER",
    ]);
    expect(config.getIdTokenErrors()).toStrictEqual(["INVALID_ISS"]);
  });

  test("If a config value is not included, the default value stands", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({
        clientConfiguration: {
          publicKey: TEST_PUBLIC_KEY,
          redirectUrls: TEST_REDIRECT_URLS,
          claims: TEST_CLAIMS,
          idTokenSigningAlgorithm: TEST_ID_TOKEN_SIGNING_ALGORITHM,
          clientLoCs: TEST_CLIENT_LOCS,
        },
        responseConfiguration: {
          sub: TEST_SUB,
          emailVerified: TEST_EMAIL_VERIFIED,
          phoneNumber: TEST_PHONE_NUMBER,
        },
      });
    expect(response.status).toEqual(200);

    const config = Config.getInstance();

    expect(config.getClientId()).toEqual("HGIOgho9HIRhgoepdIOPFdIUWgewi0jw");
    expect(config.getPublicKey()).toEqual(TEST_PUBLIC_KEY);
    expect(config.getScopes()).toEqual(["openid", "email", "phone"]);
    expect(config.getRedirectUrls()).toEqual(TEST_REDIRECT_URLS);
    expect(config.getClaims()).toEqual(TEST_CLAIMS);
    expect(config.getIdentityVerificationSupported()).toEqual(true);
    expect(config.getIdTokenSigningAlgorithm()).toEqual(
      TEST_ID_TOKEN_SIGNING_ALGORITHM
    );
    expect(config.getClientLoCs()).toEqual(TEST_CLIENT_LOCS);
    expect(config.getSub()).toEqual(TEST_SUB);
    expect(config.getEmail()).toEqual("john.smith@gmail.com");
    expect(config.getEmailVerified()).toEqual(TEST_EMAIL_VERIFIED);
    expect(config.getPhoneNumber()).toEqual(TEST_PHONE_NUMBER);
    expect(config.getPhoneNumberVerified()).toEqual(true);
    expect(config.getIdTokenErrors()).toStrictEqual([]);
    expect(config.getCoreIdentityErrors()).toStrictEqual([]);
  });

  test("If no error configuration is sent, the configured errors are removed", async () => {
    const config = Config.getInstance();
    config.setCoreIdentityErrors(["INCORRECT_SUB", "INVALID_ALG_HEADER"]);
    config.setIdTokenErrors(["INCORRECT_VOT", "INVALID_ALG_HEADER"]);
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({
        clientConfiguration: {
          publicKey: TEST_PUBLIC_KEY,
          redirectUrls: TEST_REDIRECT_URLS,
          claims: TEST_CLAIMS,
          idTokenSigningAlgorithm: TEST_ID_TOKEN_SIGNING_ALGORITHM,
          clientLoCs: TEST_CLIENT_LOCS,
        },
        responseConfiguration: {
          sub: TEST_SUB,
          emailVerified: TEST_EMAIL_VERIFIED,
          phoneNumber: TEST_PHONE_NUMBER,
        },
      });
    expect(response.status).toEqual(200);

    expect(config.getClientId()).toEqual("HGIOgho9HIRhgoepdIOPFdIUWgewi0jw");
    expect(config.getPublicKey()).toEqual(TEST_PUBLIC_KEY);
    expect(config.getScopes()).toEqual(["openid", "email", "phone"]);
    expect(config.getRedirectUrls()).toEqual(TEST_REDIRECT_URLS);
    expect(config.getClaims()).toEqual(TEST_CLAIMS);
    expect(config.getIdentityVerificationSupported()).toEqual(true);
    expect(config.getIdTokenSigningAlgorithm()).toEqual(
      TEST_ID_TOKEN_SIGNING_ALGORITHM
    );
    expect(config.getClientLoCs()).toEqual(TEST_CLIENT_LOCS);
    expect(config.getSub()).toEqual(TEST_SUB);
    expect(config.getEmail()).toEqual("john.smith@gmail.com");
    expect(config.getEmailVerified()).toEqual(TEST_EMAIL_VERIFIED);
    expect(config.getPhoneNumber()).toEqual(TEST_PHONE_NUMBER);
    expect(config.getPhoneNumberVerified()).toEqual(true);
    expect(config.getIdTokenErrors()).toStrictEqual([]);
    expect(config.getCoreIdentityErrors()).toStrictEqual([]);
  });

  test("it ignores invalid errors", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({
        clientConfiguration: {
          publicKey: TEST_PUBLIC_KEY,
          redirectUrls: TEST_REDIRECT_URLS,
          claims: TEST_CLAIMS,
          idTokenSigningAlgorithm: TEST_ID_TOKEN_SIGNING_ALGORITHM,
          clientLoCs: TEST_CLIENT_LOCS,
        },
        responseConfiguration: {
          sub: TEST_SUB,
          emailVerified: TEST_EMAIL_VERIFIED,
          phoneNumber: TEST_PHONE_NUMBER,
        },
        errorConfiguration: {
          coreIdentityErrors: ["not-a-valid-error"],
          idTokenErrors: ["INVALID_ERROR"],
        },
      });
    expect(response.status).toEqual(200);

    const config = Config.getInstance();

    expect(config.getClientId()).toEqual("HGIOgho9HIRhgoepdIOPFdIUWgewi0jw");
    expect(config.getPublicKey()).toEqual(TEST_PUBLIC_KEY);
    expect(config.getScopes()).toEqual(["openid", "email", "phone"]);
    expect(config.getRedirectUrls()).toEqual(TEST_REDIRECT_URLS);
    expect(config.getClaims()).toEqual(TEST_CLAIMS);
    expect(config.getIdentityVerificationSupported()).toEqual(true);
    expect(config.getIdTokenSigningAlgorithm()).toEqual(
      TEST_ID_TOKEN_SIGNING_ALGORITHM
    );
    expect(config.getClientLoCs()).toEqual(TEST_CLIENT_LOCS);
    expect(config.getSub()).toEqual(TEST_SUB);
    expect(config.getEmail()).toEqual("john.smith@gmail.com");
    expect(config.getEmailVerified()).toEqual(TEST_EMAIL_VERIFIED);
    expect(config.getPhoneNumber()).toEqual(TEST_PHONE_NUMBER);
    expect(config.getPhoneNumberVerified()).toEqual(true);
    expect(config.getIdTokenErrors()).toStrictEqual([]);
    expect(config.getCoreIdentityErrors()).toStrictEqual([]);
  });
});
