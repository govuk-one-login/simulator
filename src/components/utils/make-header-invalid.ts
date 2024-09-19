export const makeHeaderInvalid = (signedJwt: string): string => {
  const invalidHeader = Buffer.from(
    JSON.stringify({
      alg: "HS256",
    })
  ).toString("base64url");

  const jwtParts = signedJwt.split(".");
  return [invalidHeader, jwtParts[1], jwtParts[2]].join(".");
};
