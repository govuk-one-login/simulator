import { createApp } from "../../src/app";
import request from "supertest";

describe("/.well-known/jwks.json endpoint test", () => {
  it("returns an object containing EC and RSA keys", async () => {
    const app = createApp();
    const response = await request(app).get("/.well-known/jwks.json");

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty("keys");

    const keys = response.body["keys"];
    expect(keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kty: "EC", alg: "ES256" }),
        expect.objectContaining({ kty: "RSA", alg: "RS256" }),
      ])
    );
  });
});
