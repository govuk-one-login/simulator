import { AuthoriseRequestError } from "../errors/authorise-request-error";

const validCodeChallengeMethod = "S256";

export const validatePKCECodeChallengeAndMethod = (
  redirectUri: string,
  state: string,
  codeChallenge?: string,
  codeChallengeMethod?: string
): void => {
  if (codeChallenge === null) {
    return;
  }

  if (!codeChallenge || codeChallenge.trim() === "") {
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Invalid value for code_challenge parameter.",
      httpStatusCode: 302,
      redirectUri,
      state,
    });
  }

  if (codeChallengeMethod === null || !codeChallengeMethod) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription:
        "Request is missing code_challenge_method parameter. code_challenge_method is required when code_challenge is present.",
      httpStatusCode: 302,
      redirectUri,
      state,
    });
  }

  if (codeChallengeMethod !== validCodeChallengeMethod) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Invalid value for code_challenge_method parameter.",
      httpStatusCode: 302,
      redirectUri,
      state,
    });
  }
};
