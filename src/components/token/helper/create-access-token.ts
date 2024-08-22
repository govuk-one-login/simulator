import { randomUUID } from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  ISSUER_VALUE,
  SESSION_ID,
} from "../../../constants";
import { Config } from "../../../config";
import { logger } from "../../../logger";
import { signToken } from "./sign-token";

type AccessTokenClaims = {
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  client_id: string;
  sub: string;
  sid: string;
  scope: string[];
};

export const createAccessToken = async (
  requestScopes: string[]
): Promise<string> => {
  logger.info("Creating access token");
  const config = Config.getInstance();
  const accessTokenClaims = createAccessTokenClaimSet(requestScopes, config);
  const accessToken = await signToken(accessTokenClaims);
  return accessToken;
};

const createAccessTokenClaimSet = (
  scope: string[],
  clientConfig: Config
): AccessTokenClaims => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ACCESS_TOKEN_EXPIRY;
  const jti = randomUUID();
  const sid = SESSION_ID;
  const sub = clientConfig.getSub();
  const clientId = clientConfig.getClientId();
  //TODO: Add claims from AuthRequestParam store when identity attributes supported

  return {
    exp,
    iat,
    iss: ISSUER_VALUE,
    jti,
    client_id: clientId,
    sub,
    sid,
    scope,
  };
};
