import { TokenRequestError } from "../errors/token-request-error";
import { logger } from "../logger";
import { TokenRequest } from "../types/token-request";
import { Config } from "../config";
import { validatePrivateKeyJwt } from "../components/token/client-authentication/validate-private-key-jwt";
import { validateClientSecretPost } from "../components/token/client-authentication/validate-client-secret-post";

export const parseTokenRequest = async (
  tokenRequestBody: Record<string, string>,
  config: Config
): Promise<{
  validateClientAuthentication: () => Promise<TokenRequest>;
}> => {
  if (!tokenRequestBody.grant_type) {
    logger.error("Token Request missing grant_type");
    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request is missing grant_type parameter",
      httpStatusCode: 400,
    });
  }

  if (tokenRequestBody.grant_type !== "authorization_code") {
    logger.error(
      { grant_type: tokenRequestBody.grant_type },
      "Token request grant_type is invalid "
    );
    throw new TokenRequestError({
      errorCode: "unsupported_grant_type",
      errorDescription: "Unsupported grant type",
      httpStatusCode: 400,
    });
  }

  if (!tokenRequestBody.redirect_uri) {
    logger.error("Token request is missing redirect URI");
    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request is missing redirect_uri parameter",
      httpStatusCode: 400,
    });
  }

  if (!tokenRequestBody.code || tokenRequestBody.code.length === 0) {
    logger.error("Token request is missing code");
    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request is missing code parameter",
      httpStatusCode: 400,
    });
  }

  if (
    tokenRequestBody.client_assertion_type &&
    tokenRequestBody.client_assertion
  ) {
    return {
      validateClientAuthentication: () =>
        validatePrivateKeyJwt(tokenRequestBody, config),
    };
  } else if (tokenRequestBody.client_secret && tokenRequestBody.client_id) {
    return {
      validateClientAuthentication: () =>
        validateClientSecretPost(tokenRequestBody, config),
    };
  } else {
    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Invalid token authentication method used",
      httpStatusCode: 400,
    });
  }
};
