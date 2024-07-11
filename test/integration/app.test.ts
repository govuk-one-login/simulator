import { createApp } from "../../src/app";
import request from "supertest";

describe("Integration: Healthcheck", () => {
  test("Healthcheck endpoint returns 200", async () => {
    const app = await createApp();
    const response = await request(app).get("/");
    expect(response.status).toEqual(200);
    expect(response.text).toEqual("Express + TypeScript Server");
  });
});
