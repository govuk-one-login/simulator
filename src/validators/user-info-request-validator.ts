import { UserInfoRequestError } from "../errors/user-info-request-error";
import { IncomingHttpHeaders } from "http";
import { signedJwtValidator } from "./signed-jwt-validator";
import { Config } from "../config";
import { logger } from "../logger";

const ValidScopes: string[] = ["openid", "email", "phone"];

export const userInfoRequestValidator = async (
  userInfoRequestHeaders: IncomingHttpHeaders
): Promise<
  | { valid: true }
  | {
      valid: false;
      error: UserInfoRequestError;
    }
> => {
  const authorisationHeader = userInfoRequestHeaders.authorization;
  if (!authorisationHeader) {
    logger.warn("Missing authorisation header.");
    return { valid: false, error: UserInfoRequestError.MISSING_TOKEN };
  }

  const match = /^Bearer (?<token>.*)$/.exec(authorisationHeader);
  const accessToken = match?.groups?.token;

  if (!accessToken) {
    logger.warn("Failed to parse token in authorisation header.");
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  const jwtResult = await signedJwtValidator(accessToken);
  if (!jwtResult.valid) {
    logger.warn("Failed to verify token signature.");
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  const config = Config.getInstance();
  const config_client_id = config.getClientId();
  const config_scopes = config.getScopes();

  const { client_id, scope } = jwtResult.payload;

  if (!client_id || client_id != config_client_id) {
    logger.warn(
      `Client ID "${client_id}" does not match expected value "${config_client_id}"."`
    );
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  if (
    !Array.isArray(scope) ||
    !scope.every((s) => typeof s == "string") ||
    scope.some((s) => !ValidScopes.includes(s)) ||
    scope.some((s) => !config_scopes.includes(s))
  ) {
    logger.warn(
      `Scopes "[${scope}]" don't match expected values "[${config_scopes}]".`
    );
    return { valid: false, error: UserInfoRequestError.INVALID_SCOPE };
  }

  const accessTokensForClient = config.getAccessTokensFromStore(
    `${config_client_id}.${config.getSub()}`
  );

  if (!accessTokensForClient?.includes(accessToken)) {
    logger.warn("Access token not found in access token store");
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  return { valid: true };
};
