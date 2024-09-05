import { UserInfoRequestError } from "../errors/user-info-request-error";
import { IncomingHttpHeaders } from "http";
import { signedJwtValidator } from "./signed-jwt-validator";
import { Config } from "../config";
import { logger } from "../logger";

const AuthorisationHeaderKey: string = "authorization";
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
  for (const key of Object.keys(userInfoRequestHeaders)) {
    userInfoRequestHeaders[key.toLowerCase()] = userInfoRequestHeaders[key];
  }
  const accessToken = userInfoRequestHeaders[AuthorisationHeaderKey];
  let match;
  try {
    match = /^Bearer (?<token>.*)$/.exec(accessToken as string);
  } catch (error) {
    logger.error("Failed To parse authorisation header.", error);
    return { valid: false, error: UserInfoRequestError.MISSING_TOKEN };
  }

  if (!match?.groups?.token) {
    logger.warn("Missing access token in authorisation header.");
    return { valid: false, error: UserInfoRequestError.MISSING_TOKEN };
  }

  const jwtResult = await signedJwtValidator(match.groups.token);
  if (!jwtResult.valid) {
    logger.warn("Failed to verify jwt signature.");
    return { valid: false, error: UserInfoRequestError.INVALID_TOKEN };
  }

  const config = Config.getInstance();
  const config_client_id = config.getClientId();
  const config_scopes = config.getScopes();

  const { client_id, scope } = jwtResult.payload;

  if (client_id != config_client_id) {
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
      `Scopes "${scope}" don't match expected values "${config_scopes}".`
    );
    return { valid: false, error: UserInfoRequestError.INVALID_SCOPE };
  }

  return { valid: true };
};
