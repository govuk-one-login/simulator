import {
  ClaimsParameter,
  Client,
  errors,
  KoaContextWithOIDC,
} from "oidc-provider";
import { Config } from "../config.js";
import { VALID_CLAIMS } from "../constants/provider-config.js";
import { logger } from "../logger.js";

export const claimsValidator = (
  _ctx: KoaContextWithOIDC,
  claims: ClaimsParameter,
  _client: Client
): void => {
  if (!claims || !claims.userinfo) {
    return;
  }
  const clientClaims = Config.getInstance().getClaims();
  const includedClaims = Object.keys(claims.userinfo);

  const invalidClaims = includedClaims.filter(
    (claim) => !VALID_CLAIMS.includes(claim)
  );

  if (invalidClaims.length > 0) {
    logger.error(
      "Invalid claims included in request",
      invalidClaims.join(", ")
    );
    throw new errors.InvalidRequest("Request contains invalid claims", 302);
  }

  const unsupportedClaims = includedClaims.filter(
    (claim) => !clientClaims.includes(claim)
  );

  if (unsupportedClaims.length > 0) {
    logger.error(
      `Request contains claims unsupported by client:
      Unsupported Claims: ${unsupportedClaims.join(", ")}
      Client Claims: ${clientClaims}`
    );
    throw new errors.InvalidRequest("Request contains invalid claims", 302);
  }

  logger.info("Claims present and valid in Auth request");
  return;
};
