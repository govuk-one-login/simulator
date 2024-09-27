import { randomBytes } from "crypto";

export const fakeSignature = (signedJwt: string): string => {
  const invalidSignature = randomBytes(32).toString("base64url");
  const [header, payload] = signedJwt.split(".");
  return [header, payload, invalidSignature].join(".");
};
