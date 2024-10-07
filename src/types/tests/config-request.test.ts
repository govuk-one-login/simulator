import request from "supertest";
import { createTestValidationApp } from "./validator-helper";
import ConfigRequest, {
  generateConfigRequestPropertyValidators,
} from "../config-request";

describe("config request validator", () => {
  const app = createTestValidationApp(
    generateConfigRequestPropertyValidators()
  );

  test("returns 200 for valid config request", async () => {
    const body: ConfigRequest = {
      clientConfiguration: {},
      responseConfiguration: {},
      errorConfiguration: {},
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

  test("returns 400 for invalid clientConfiguration", async () => {
    const body: object = { clientConfiguration: [] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.clientConfiguration.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid responseConfiguration", async () => {
    const body: object = { responseConfiguration: 0 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.responseConfiguration.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid errorConfiguration", async () => {
    const body: object = { errorConfiguration: "" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.errorConfiguration.msg).toEqual(
      "Invalid value"
    );
  });
});
