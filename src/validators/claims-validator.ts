import { logger } from "../logger.js";
import { Config } from "../config.js";
import { VALID_CLAIMS } from "../constants.js";
import { UserIdentityClaim } from "../types/user-info.js";

export const areClaimsValid = (claims: string[], config: Config): boolean => {
  const clientClaims = config.getClaims();

  const invalidClaims = claims.filter(
    (claim) => !VALID_CLAIMS.includes(claim as UserIdentityClaim)
  );

  if (invalidClaims.length !== 0) {
    logger.error(
      "Invalid claims included in request" + invalidClaims.join(", ")
    );
    return false;
  }

  const unsupportedClaims = claims.filter(
    (claim) => !clientClaims.includes(claim as UserIdentityClaim)
  );

  if (unsupportedClaims.length !== 0) {
    logger.error(
      `Request contains claims unsupported by client: Unsupported Claims: ${unsupportedClaims.join(", ")} Client Claims: ${clientClaims}`
    );
    return false;
  }

  return true;
};
