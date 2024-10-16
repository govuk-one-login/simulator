import { createApp } from "../../src/app";
import request from "supertest";
import { EC_PRIVATE_IDENTITY_SIGNING_KEY_ID } from "../../src/constants";
import { generateDidJwks } from "../../src/components/token/helper/key-helpers";

describe("/.well-known/did.json endpoint test", () => {
  it("returns the expected object", async () => {
    const app = createApp();
    const response = await request(app).get("/.well-known/did.json");

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/jwk/v1",
      ],
      id: "did:web:localhost%3A3000",
      assertionMethod: [
        {
          type: "JsonWebKey",
          id: `did:web:localhost%3A3000#${EC_PRIVATE_IDENTITY_SIGNING_KEY_ID}`,
          controller: "did:web:localhost%3A3000",
          publicKeyJwk: await generateDidJwks(),
        },
      ],
    });
  });
});
