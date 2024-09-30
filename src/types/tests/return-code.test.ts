import request from "supertest";
import ReturnCode, {
  generateReturnCodePropertyValidators,
} from "../return-code";
import { createTestValidationApp } from "./validator-helper";

describe("return code validator", () => {
  const app = createTestValidationApp(generateReturnCodePropertyValidators());

  test("returns 200 for valid return code", async () => {
    const body: ReturnCode = { code: "PLACEHOLDER" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({});
  });

  test("returns 400 for unknown property", async () => {
    const body: object = {
      code: "PLACEHOLDER",
      someUnknownField: "some-value",
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body?.errors?._unknown_fields?.msg).toEqual(
      "Unknown field(s)"
    );
  });

  test("returns 400 for invalid code", async () => {
    const body: object = { code: 5 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.code.msg).toEqual("Invalid value");
  });

  test("returns 400 for missing code", async () => {
    const body: object = {};
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.code.msg).toEqual("Invalid value");
  });
});
