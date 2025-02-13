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

export const createAccessToken = async (
  scope: string[],
  vtr: VectorOfTrust,
  claims?: string[] | null
): Promise<string> => {
  logger.info("Creating access token");
  const config = Config.getInstance();
  const accessTokenClaims = createAccessTokenClaimSet(
    scope,
    config,
    getClaimsRequest(vtr, claims)
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
  claims?: string[] | null
): AccessTokenClaims => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ACCESS_TOKEN_EXPIRY;
  const jti = randomUUID();
  const sid = SESSION_ID;
  const sub = config.getSub();
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
    ...(claims && { claims }),
  };
};
