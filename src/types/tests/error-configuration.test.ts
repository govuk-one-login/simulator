import request from "supertest";
import { createTestValidationApp } from "./validator-helper";
import {
  ErrorConfiguration,
  generateErrorConfigPropertyValidators,
} from "../error-configuration";

describe("return error configuration", () => {
  const app = createTestValidationApp(generateErrorConfigPropertyValidators());

  test("returns 200 for valid error configuration", async () => {
    const body: ErrorConfiguration = {
      coreIdentityErrors: ["INVALID_ALG_HEADER"],
      idTokenErrors: ["TOKEN_EXPIRED"],
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({});
  });

  test("returns 400 for unknown property", async () => {
    const body: object = {
      someUnknownField: "some-value",
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body?.errors?._unknown_fields?.msg).toEqual(
      "Unknown field(s)"
    );
  });

  test("returns 400 for coreIdentityErrors", async () => {
    const body: object = { coreIdentityErrors: ["invalid-error"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["coreIdentityErrors[0]"].msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for idTokenErrors", async () => {
    const body: object = { idTokenErrors: ["invalid-error"] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors["idTokenErrors[0]"].msg).toEqual(
      "Invalid value"
    );
  });
});
