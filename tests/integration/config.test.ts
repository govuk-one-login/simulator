import { createApp } from "../../src/app";
import request from "supertest";

describe("/config endpoint", () => {
  it("returns error for wrong clientConfiguration type", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({ clientConfiguration: [] });
    expect(response.status).toEqual(400);
  });

  it("returns error for null responseConfiguration", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({ responseConfiguration: null });
    expect(response.status).toEqual(400);
  });

  it("returns error for wrong responseConfiguration.emailVerified type", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({ responseConfiguration: { emailVerified: "yes" } });
    expect(response.status).toEqual(400);
  });

  it("returns error for wrong body type: []", async () => {
    const app = createApp();
    const response = await request(app).post("/config").send([]);
    expect(response.status).toEqual(400);
  });

  it("returns error for wrong body type", async () => {
    const app = createApp();
    const response = await request(app).post("/config").send({ abc: 123 });
    expect(response.status).toEqual(400);
  });

  it("returns success for valid config request", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/config")
      .send({
        responseConfiguration: { emailVerified: true },
        clientConfiguration: { redirectUrls: ["https://some.url.com"] },
      });
    expect(response.body).toStrictEqual({});
    expect(response.status).toEqual(200);
  });
});
