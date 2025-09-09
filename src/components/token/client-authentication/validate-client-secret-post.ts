import { ParseTokenRequestError } from "../../../errors/parse-token-request-error";
import { TokenRequest } from "../../../types/token-request";
import { logger } from "../../../logger";
import { TokenRequestError } from "../../..//errors/token-request-error";
import { Config } from "../../../config";
import { isClientSecretValid } from "../../../validators/client-secret-validator";

export const validateClientSecretPost = async (
  tokenRequest: Record<string, string>,
  config: Config
): Promise<TokenRequest> => {
  let parsedClientSecretPost: {
    clientId: string;
    clientSecret: string;
  };

  try {
    parsedClientSecretPost = parseClientSecretPost(
      tokenRequest.client_id,
      tokenRequest.client_secret
    );
  } catch (error) {
    logger.warn(
      "Failed to parse Client secret post: " + (error as Error).message
    );

    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Invalid client secret",
      httpStatusCode: 400,
    });
  }

  if (parsedClientSecretPost.clientId !== config.getClientId()) {
    logger.warn("Invalid Client provided in Client secret post");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Client authentication failed",
      httpStatusCode: 400,
    });
  }

  if (
    !config.getTokenAuthMethod() ||
    config.getTokenAuthMethod() !== "client_secret_post"
  ) {
    logger.warn("Client is not configured to use client_secret_post");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Client is not registered to use client_secret_post",
      httpStatusCode: 400,
    });
  }

  if (!config.getClientSecretHash()) {
    logger.warn("No client secret hash registered for client");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "No client secret registered",
      httpStatusCode: 400,
    });
  }

  if (
    !(await isClientSecretValid(
      parsedClientSecretPost.clientSecret,
      config.getClientSecretHash()
    ))
  ) {
    logger.warn("Invalid client_secret provided for client");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Invalid client secret",
      httpStatusCode: 400,
    });
  }

  return tokenRequest as TokenRequest;
};

const parseClientSecretPost = (
  clientId?: string,
  clientSecret?: string
): {
  clientId: string;
  clientSecret: string;
} => {
  if (!clientId) {
    throw new ParseTokenRequestError("Missing client_id parameter");
  }

  if (!clientSecret) {
    throw new ParseTokenRequestError("Missing client_secret parameter");
  }

  return { clientId, clientSecret };
};
