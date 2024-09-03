import { logger } from "../logger";
import { Config } from "../config";
import { VALID_SCOPES } from "../constants";

export const areScopesValid = (scopes: string[], config: Config): boolean => {
  const invalidScopes = scopes.filter((scope) => !VALID_SCOPES.includes(scope));

  if (invalidScopes.length > 0) {
    logger.warn("Request included invalid scopes: " + invalidScopes.join(", "));
    return false;
  }

  const clientScopes = config.getScopes();

  const unsupportedScopes = scopes.filter(
    (scope) => !clientScopes.includes(scope)
  );

  if (unsupportedScopes.length > 0) {
    logger.warn(
      "Request included scopes not supported by the client: " +
        unsupportedScopes.join(", ")
    );
    return false;
  }

  return true;
};
