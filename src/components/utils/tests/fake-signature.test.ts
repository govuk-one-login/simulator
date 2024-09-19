import crypto from "crypto";
import { fakeSignature } from "../fake-signature";

describe("fakeSignature tests", () => {
  const testToken =
    "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI5MTYyNjY3LWUwMjUtNGQ5My04YzViLWU1MzhlNmM3OTJhYyJ9.eyJpYXQiOjE3MjY3NDQyNzksImV4cCI6MTcyNjc0NDM5OSwiYXRfaGFzaCI6IktydllHM0xWVlEzcTZ1TVRfVC1Gd3ciLCJzdWIiOiJ1cm46ZmRjOmdvdi51azoyMDIyOjllMzc0YjQ3YzRlZjZkZTY1NTFiZTVmMjhkOTdmOWRkIiwiYXVkIjoiZDc2ZGI1Njc2MGNlZGE3Y2FiODc1ZjA4NWM1NGJkMzUiLCJpc3MiOiJodHRwczovL29pZGMuYWNjb3VudC5nb3YudWsiLCJzaWQiOiI1MGE5MDQxYjVkNTdjYjUzNjMyYTBlOTI1OTg2NGI3MSIsInZvdCI6IkNsLkNtIiwibm9uY2UiOiJiZjA1YzM2ZGE5MTIyYTczNzg0Mzk5MjRjMDExYzUxYyIsInZ0bSI6Imh0dHBzOi8vb2lkYy5hY2NvdW50Lmdvdi51ay90cnVzdG1hcmsifQ.qYBYPBU_aebwPgRrmDH5hs4Je3fqNJmGPoPoBnIrGQ-F4aBPYAp2nIP-87w3A04vyMOQ4eckGWUkMaKgpt20tQ";

  it("replaces a signed JWT signature with a random string", () => {
    jest
      .spyOn(crypto, "randomBytes")
      .mockImplementation(() =>
        Buffer.from("ev5Z6kN4jORG2cMZp-NpEUT_hpvWOOQmGZeu3nAaQUo")
      );

    expect(fakeSignature(testToken)).toStrictEqual(
      "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI5MTYyNjY3LWUwMjUtNGQ5My04YzViLWU1MzhlNmM3OTJhYyJ9.eyJpYXQiOjE3MjY3NDQyNzksImV4cCI6MTcyNjc0NDM5OSwiYXRfaGFzaCI6IktydllHM0xWVlEzcTZ1TVRfVC1Gd3ciLCJzdWIiOiJ1cm46ZmRjOmdvdi51azoyMDIyOjllMzc0YjQ3YzRlZjZkZTY1NTFiZTVmMjhkOTdmOWRkIiwiYXVkIjoiZDc2ZGI1Njc2MGNlZGE3Y2FiODc1ZjA4NWM1NGJkMzUiLCJpc3MiOiJodHRwczovL29pZGMuYWNjb3VudC5nb3YudWsiLCJzaWQiOiI1MGE5MDQxYjVkNTdjYjUzNjMyYTBlOTI1OTg2NGI3MSIsInZvdCI6IkNsLkNtIiwibm9uY2UiOiJiZjA1YzM2ZGE5MTIyYTczNzg0Mzk5MjRjMDExYzUxYyIsInZ0bSI6Imh0dHBzOi8vb2lkYy5hY2NvdW50Lmdvdi51ay90cnVzdG1hcmsifQ.ZXY1WjZrTjRqT1JHMmNNWnAtTnBFVVRfaHB2V09PUW1HWmV1M25BYVFVbw"
    );
  });
});
