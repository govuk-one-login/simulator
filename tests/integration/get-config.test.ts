import request from "supertest";
import { createApp } from "../../src/app";
import { Config } from "../../src/config";

test("returns 200 response with current configuration", async () => {
  const app = createApp();

  const response = await request(app).get("/config");

  expect(response.status).toEqual(200);
  const config = Config.getInstance();
  const expectedBody = {
    clientConfiguration: config.getClientConfiguration(),
    responseConfiguration: config.getResponseConfiguration(),
    errorConfiguration: config.getErrorConfiguration(),
    simulatorUrl: config.getSimulatorUrl(),
    publishNewIdTokenKeysEnabled:
      config.isPublishNewIdTokenSigningKeysEnabled(),
    usingNewIdTokenSigningKeys: config.isUseNewIdTokenSigningKeysEnabled(),
  };
  expect(response.body).toEqual(expectedBody);
});
