import { Client, errors, KoaContextWithOIDC } from "oidc-provider";
import { Config } from "../config.js";
import { VALID_SCOPES } from "../constants/provider-config.js";
import { logger } from "../logger.js";

export const scopeValidator = (
  ctx: KoaContextWithOIDC,
  _scope: string | undefined,
  _client: Client
) => {
  //We are using the scope parameter from the request url search params
  // not the value passed to this function as the package
  // will drop any scopes not known to the OP
  //https://openid.net/specs/openid-connect-core-1_0.html#:~:text=Authorization%20Code%20Flow%3A-,scope,-REQUIRED.%20OpenID%20Connect

  const scopeParam = ctx.URL.searchParams.get("scope");

  if (!scopeParam) {
    throw new errors.InvalidRequest("Invalid request");
  }

  const scopes = scopeParam.split(" ");
  const invalidScopes = scopes.filter((scope) => !VALID_SCOPES.includes(scope));

  if (invalidScopes.length > 0) {
    logger.error("Request includes invalid scopes");
    throw new errors.InvalidScope(
      "Invalid, unknown or malformed scope",
      invalidScopes.join(" ")
    );
  }

  const clientScopes = Config.getInstance().getScopes();

  const unsupportedScopes = scopes.filter(
    (scope) => !clientScopes.includes(scope)
  );

  if (unsupportedScopes.length > 0) {
    logger.error(
      "Request includes scopes not supported in client configuration"
    );

    throw new errors.InvalidScope(
      "Invalid, unknown or malformed scope",
      invalidScopes.join(" ")
    );
  }
};
