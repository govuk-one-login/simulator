import { verifyChallenge } from "pkce-challenge";
import { TokenRequestError } from "src/errors/token-request-error";

export const comparePKCECodeChallengeAndVerifier = (
  redirectUri: string,
  codeChallenge?: string,
  codeVerifier?: string
): void => {
  if (codeChallenge === null && codeVerifier === null) {
    return;
  }

  if (!!codeVerifier && codeChallenge === null) {
    // TODO: check error code and description
    throw new TokenRequestError({
      errorCode: "invalid_grant",
      errorDescription: "Invalid grant",
      httpStatusCode: 400,
    });
  }

  if (!!codeChallenge && codeVerifier === null) {
    // TODO: check error code and description
    throw new TokenRequestError({
      errorCode: "invalid_grant",
      errorDescription: "Invalid grant",
      httpStatusCode: 400,
    });
  }

  if (!verifyChallenge(codeVerifier!, codeChallenge!)) {
    // TODO: check error code and description
    throw new TokenRequestError({
      errorCode: "invalid_grant",
      errorDescription: "Invalid grant",
      httpStatusCode: 400,
    });
  }
};
