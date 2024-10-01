import { createApp } from "../../src/app";
import request from "supertest";

describe("/trustmark endpoint test", () => {
  it("returns the expected object", async () => {
    const app = createApp();
    const response = await request(app).get("/trustmark");

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      idp: "http://host.docker.internal:3000/",
      trustmark_provider: "http://host.docker.internal:3000/",
      C: ["Cl", "Cl.Cm"],
      P: ["P0", "P1", "P2"],
    });
  });
});
