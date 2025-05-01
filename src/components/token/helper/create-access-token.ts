import { randomUUID } from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  NON_IDENTITY_LOC_VALUES,
  SESSION_ID,
} from "../../../constants";
import { Config } from "../../../config";
import { logger } from "../../../logger";
import { signToken } from "./sign-token";
import { AccessTokenClaims } from "../../../types/access-token-claims";
import { VectorOfTrust } from "../../../types/vector-of-trust";
import AuthRequestParameters from "src/types/auth-request-parameters";

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
