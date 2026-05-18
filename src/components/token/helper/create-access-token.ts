import { randomUUID } from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  NON_IDENTITY_LOC_VALUES,
  SESSION_ID,
} from "../../../constants.js";
import { Config } from "../../../config.js";
import { logger } from "../../../logger.js";
import { signToken } from "./sign-token.js";
import { AccessTokenClaims } from "../../../types/access-token-claims.js";
import { VectorOfTrust } from "../../../types/vector-of-trust.js";
import AuthRequestParameters from "src/types/auth-request-parameters.js";

export const createAccessToken = async (
  authRequestParams: AuthRequestParameters
): Promise<string> => {
  logger.info("Creating access token");
  const config = Config.getInstance();
  const accessTokenClaims = createAccessTokenClaimSet(
    authRequestParams.scopes,
    config,
    authRequestParams.responseConfiguration?.sub ?? config.getSub(),
    getClaimsRequest(authRequestParams.vtr, authRequestParams.claims)
  );
  const accessToken = await signToken(accessTokenClaims);
  return accessToken;
};

export const getClaimsRequest = (
  vtr: VectorOfTrust,
  claims?: string[] | null
): string[] | null => {
  if (!NON_IDENTITY_LOC_VALUES.includes(vtr.levelOfConfidence) && claims) {
    return claims;
  }
  return null;
};

const createAccessTokenClaimSet = (
  scope: string[],
  config: Config,
  sub: string,
  claims?: string[] | null
): AccessTokenClaims => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ACCESS_TOKEN_EXPIRY;
  const jti = randomUUID();
  const sid = SESSION_ID;
  const clientId = config.getClientId();

  return {
    exp,
    iat,
    iss: config.getIssuerValue(),
    jti,
    client_id: clientId,
    sub,
    sid,
    scope,
    ...(claims && claims.length > 0 && { claims }),
  };
};
