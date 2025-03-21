import { base64url } from "jose";
import { createHash } from "node:crypto";
import { TokenRequestError } from "../../../errors/token-request-error";

export const comparePKCECodeChallengeAndVerifier = (
  codeChallenge?: string,
  codeVerifier?: string
): void => {
  if (!codeChallenge && !codeVerifier) {
    return;
  }

  if (
    !codeVerifier ||
    !codeChallenge ||
    !verifyChallenge(codeVerifier, codeChallenge)
  ) {
    throw new TokenRequestError({
      errorCode: "invalid_grant",
      errorDescription: "PKCE code verification failed",
      httpStatusCode: 400,
    });
  }
};

const verifyChallenge = (
  codeVerifier: string,
  codeChallenge: string
): boolean => {
  const hash = createHash("sha256");
  const result = hash.update(codeVerifier).digest();
  const newCodeChallenge = base64url.encode(result);
  return newCodeChallenge === codeChallenge;
};
