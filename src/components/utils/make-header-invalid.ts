const INVALID_KEY_KID = "60c01993-94cd-4d32-a4da-2a44dba7e45b";
const makeHeaderInvalid = (signedJwt: string): string => {
  const invalidHeader = Buffer.from(
    JSON.stringify({
      kid: INVALID_KEY_KID,
      alg: "HS256",
    })
  ).toString("base64url");

  const jwtParts = signedJwt.split(".");
  return [invalidHeader, jwtParts[1], jwtParts[2]].join(".");
};

export { INVALID_KEY_KID, makeHeaderInvalid };
