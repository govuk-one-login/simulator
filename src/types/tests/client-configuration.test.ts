import { createTestValidationApp } from "./validator-helper";
import request from "supertest";
import ClientConfiguration, {
  generateClientConfigurationPropertyValidators,
} from "../client-configuration";

describe("client configuration validator", () => {
  const app = createTestValidationApp(
    generateClientConfigurationPropertyValidators()
  );

  test("returns 200 for valid client configuration", async () => {
    const body: ClientConfiguration = {
      clientId: "Client_ID",
      publicKey: "98VgdzMgIYl0RdtlYu7ji21GEqD7op9v",
      scopes: ["email"],
      redirectUrls: ["https://rp.redirect.gov.uk"],
      claims: ["https://vocab.account.gov.uk/v1/coreIdentityJWT"],
      identityVerificationSupported: false,
      idTokenSigningAlgorithm: "ES256",
      clientLoCs: ["P1"],
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({});
  });

  test("returns 400 for unknown property", async () => {
    const body: object = {
      someUnknownProperty: "some-value",
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body?.errors?._unknown_fields?.msg).toEqual(
      "Unknown field(s)"
    );
  });

  test("returns 400 missing clientId", async () => {
    const body: object = { clientId: 0 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.clientId.msg).toEqual("Invalid value");
  });

  test("returns 400 missing publicKey", async () => {
    const body: object = { publicKey: 0 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.publicKey.msg).toEqual("Invalid value");
  });

  test("returns 400 missing scopes", async () => {
    const body: object = { scopes: ["invalid-scope"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["scopes[0]"].msg).toEqual("Invalid value");
  });

  test("returns 400 missing redirectUrls", async () => {
    const body: object = { redirectUrls: ["invalid-url"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["redirectUrls[0]"].msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 missing claims", async () => {
    const body: object = { claims: ["https://gov.uk/invalid-claim"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["claims[0]"].msg).toEqual("Invalid value");
  });

  test("returns 400 missing identityVerificationSupported", async () => {
    const body: object = { identityVerificationSupported: 1 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.identityVerificationSupported.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 missing idTokenSigningAlgorithm", async () => {
    const body: object = { idTokenSigningAlgorithm: "invalid-alg" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.idTokenSigningAlgorithm.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 missing clientLoCs", async () => {
    const body: object = { clientLoCs: ["Cl.Cm"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["clientLoCs[0]"].msg).toEqual("Invalid value");
  });
});
