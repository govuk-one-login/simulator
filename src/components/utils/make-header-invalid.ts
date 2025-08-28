const INVALID_KEY_KID = "60c01993-94cd-4d32-a4da-2a44dba7e45b";
const makeHeaderInvalid = (
  signedJwt: string,
  didController?: string
): string => {
  let kid = INVALID_KEY_KID;
  if (didController != null) {
    kid = `${didController}#${INVALID_KEY_KID}`;
  }
  const invalidHeader = Buffer.from(
    JSON.stringify({
      alg: "HS256",
      kid,
    })
  ).toString("base64url");

  const jwtParts = signedJwt.split(".");
  return [invalidHeader, jwtParts[1], jwtParts[2]].join(".");
};

export { INVALID_KEY_KID, makeHeaderInvalid };
