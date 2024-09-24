import { logger } from "../logger";
import { Config } from "../config";
import { VALID_CLAIMS } from "../constants";
import { ReturnCodeError } from "../errors/return-code-error";

export const areClaimsValid = (claims: string[], config: Config): boolean => {
  const clientClaims = config.getClaims();

  const invalidClaims = claims.filter((claim) => !VALID_CLAIMS.includes(claim));

  if (invalidClaims.length !== 0) {
    logger.error(
      "Invalid claims included in request" + invalidClaims.join(", ")
    );
    return false;
  }

  const unsupportedClaims = claims.filter(
    (claim) => !clientClaims.includes(claim)
  );

  if (unsupportedClaims.length !== 0) {
    logger.error(
      `Request contains claims unsupported by client: Unsupported Claims: ${unsupportedClaims.join(", ")} Client Claims: ${clientClaims}`
    );
    return false;
  }

  return true;
};

export const checkForReturnCode = (
  config: Config,
  claims: string[],
  redirectUri: string
): void => {
  const returnCode = config.getReturnCode();
  if (returnCode) {
    if (claims.includes("https://vocab.account.gov.uk/v1/returnCode")) {
      throw new ReturnCodeError(`Return Code: ${returnCode.code}`, redirectUri);
    } else {
      throw new ReturnCodeError(
        "Access Denied: Not requested to view return code",
        redirectUri
      );
    }
  }
};
