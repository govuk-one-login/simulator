export const decodeJwtNoVerify = (
  signedJwt: string
): {
  payload: Record<string, string>;
  protectedHeader: Record<string, string>;
} => {
  const [headerPart, payloadPart] = signedJwt.split(".");
  const payload = decodeTokenPart(payloadPart);
  const protectedHeader = decodeTokenPart(headerPart);
  return { payload, protectedHeader };
};

const decodeTokenPart = (part: string): Record<string, string> =>
  JSON.parse(Buffer.from(part, "base64url").toString());
