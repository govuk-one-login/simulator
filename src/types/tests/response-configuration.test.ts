import { createTestValidationApp } from "./validator-helper";
import request from "supertest";
import ResponseConfiguration, {
  generateResponseConfigurationPropertyValidators,
} from "../response-configuration";

describe("response configuration validator", () => {
  const app = createTestValidationApp(
    generateResponseConfigurationPropertyValidators()
  );

  test("returns 200 for valid response configuration", async () => {
    const body: ResponseConfiguration = {
      sub: "example subject",
      email: "test@example.com",
      emailVerified: true,
      phoneNumber: "07123456789",
      phoneNumberVerified: false,
      maxLoCAchieved: "P2",
      coreIdentityVerifiableCredentials: { exampleField: "example value" },
      passportDetails: [{ exampleField: "example value" }],
      drivingPermitDetails: [{ exampleField: "example value" }],
      postalAddressDetails: [{ exampleField: "example value" }],
      returnCodes: [{ code: "example_code" }],
    };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({});
  });

  test("returns 400 for unknown property", async () => {
    const body: object = { someUnknownProperty: "some-value" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body?.errors?._unknown_fields?.msg).toEqual(
      "Unknown field(s)"
    );
  });

  test("returns 400 for invalid sub", async () => {
    const body: object = { sub: false };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.sub.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid email", async () => {
    const body: object = { email: false };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.email.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid emailVerified", async () => {
    const body: object = { emailVerified: "yes" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.emailVerified.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid phoneNumber", async () => {
    const body: object = { phoneNumber: 712456789 };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.phoneNumber.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid phoneNumberVerified", async () => {
    const body: object = { phoneNumberVerified: "no" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.phoneNumberVerified.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid maxLoCAchieved", async () => {
    const body: object = { maxLoCAchieved: "Cl.P0" };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.maxLoCAchieved.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid coreIdentityVerifiableCredentials", async () => {
    const body: object = { coreIdentityVerifiableCredentials: [] };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.coreIdentityVerifiableCredentials.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid passportDetails", async () => {
    const body: object = { passportDetails: {} };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.passportDetails.msg).toEqual("Invalid value");
  });

  test("returns 400 for invalid drivingPermitDetails", async () => {
    const body: object = { drivingPermitDetails: {} };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.drivingPermitDetails.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid postalAddressDetails", async () => {
    const body: object = { postalAddressDetails: {} };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.postalAddressDetails.msg).toEqual(
      "Invalid value"
    );
  });

  test("returns 400 for invalid returnCodes", async () => {
    const body: object = { returnCodes: {} };
    const response = await request(app).post("/test-validation").send(body);
    expect(response.status).toEqual(400);
    expect(response.body.errors.returnCodes.msg).toEqual("Invalid value");
  });
});
