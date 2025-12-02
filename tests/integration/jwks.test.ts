import { createApp } from "../../src/app";
import request from "supertest";
import {
  EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
  EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
} from "../../src/constants";
import { Config } from "../../src/config";

describe("/.well-known/jwks.json endpoint test", () => {
  beforeEach(() => {
    delete process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS;
  });

  it("returns an object containing EC and RSA keys", async () => {
    const app = createApp();
    const response = await request(app).get("/.well-known/jwks.json");

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty("keys");
    expect(response.header["cache-control"]).toEqual("max-age=86400");

    const keys = response.body["keys"];
    expect(response.body.keys.length).toEqual(2);
    expect(keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kty: "EC",
          alg: "ES256",
          kid: EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
        }),
        expect.objectContaining({
          kty: "RSA",
          alg: "RS256",
          kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
        }),
      ])
    );
  });

  it("returns 4 keys when the config option is enabled", async () => {
    process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS = "true";
    Config.resetInstance();

    const app = createApp();
    expect(Config.getInstance().isPublishNewIdTokenSigningKeysEnabled()).toBe(
      true
    );
    const response = await request(app).get("/.well-known/jwks.json");

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty("keys");
    expect(response.body.keys.length).toEqual(4);
    expect(response.header["cache-control"]).toEqual("max-age=86400");

    const keys = response.body["keys"];
    expect(keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kty: "EC",
          alg: "ES256",
          kid: EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
        }),
        expect.objectContaining({
          kty: "RSA",
          alg: "RS256",
          kid: RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
        }),
        expect.objectContaining({
          kty: "EC",
          alg: "ES256",
          kid: EC_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
        }),
        expect.objectContaining({
          kty: "RSA",
          alg: "RS256",
          kid: RSA_PRIVATE_SECONDARY_TOKEN_SIGNING_KEY_ID,
        }),
      ])
    );
  });
});
