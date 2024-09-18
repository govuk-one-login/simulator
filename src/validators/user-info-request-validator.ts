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
  const accessToken = userInfoRequestHeaders.authorization;
  if (!accessToken) {
    logger.warn("Missing authorisation header.");
    return { valid: false, error: UserInfoRequestError.MISSING_TOKEN };
  }

  let match;
  try {
    match = /^Bearer (?<token>.*)$/.exec(accessToken);
  } catch (error) {
    logger.error("Error parsing authorisation header.", error);
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  if (!match?.groups?.token) {
    logger.warn("Failed to parse token in authorisation header.");
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  const jwtResult = await signedJwtValidator(match.groups.token);
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

  return { valid: true };
};
