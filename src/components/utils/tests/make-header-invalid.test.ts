import { makeHeaderInvalid } from "../make-header-invalid";

describe("makeHeaderInvalid tests", () => {
  const testToken =
    "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI5MTYyNjY3LWUwMjUtNGQ5My04YzViLWU1MzhlNmM3OTJhYyJ9.eyJpYXQiOjE3MjY3NDQyNzksImV4cCI6MTcyNjc0NDM5OSwiYXRfaGFzaCI6IktydllHM0xWVlEzcTZ1TVRfVC1Gd3ciLCJzdWIiOiJ1cm46ZmRjOmdvdi51azoyMDIyOjllMzc0YjQ3YzRlZjZkZTY1NTFiZTVmMjhkOTdmOWRkIiwiYXVkIjoiZDc2ZGI1Njc2MGNlZGE3Y2FiODc1ZjA4NWM1NGJkMzUiLCJpc3MiOiJodHRwczovL29pZGMuYWNjb3VudC5nb3YudWsiLCJzaWQiOiI1MGE5MDQxYjVkNTdjYjUzNjMyYTBlOTI1OTg2NGI3MSIsInZvdCI6IkNsLkNtIiwibm9uY2UiOiJiZjA1YzM2ZGE5MTIyYTczNzg0Mzk5MjRjMDExYzUxYyIsInZ0bSI6Imh0dHBzOi8vb2lkYy5hY2NvdW50Lmdvdi51ay90cnVzdG1hcmsifQ.qYBYPBU_aebwPgRrmDH5hs4Je3fqNJmGPoPoBnIrGQ-F4aBPYAp2nIP-87w3A04vyMOQ4eckGWUkMaKgpt20tQ";

  it("replaces a valid header with an invalid one with an unsupported alg", () => {
    const jwtWithInvalidHeader = makeHeaderInvalid(testToken);
    const [header] = jwtWithInvalidHeader.split(".");
    const parsedHeader = JSON.parse(
      Buffer.from(header, "base64url").toString()
    );
    expect(parsedHeader).toStrictEqual({
      alg: "HS256",
    });
  });
});
