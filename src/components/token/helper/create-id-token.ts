import { createHash } from "crypto";
import { Config } from "../../../config";
import {
  ID_TOKEN_EXPIRY,
  ISSUER_VALUE,
  SESSION_ID,
  TRUSTMARK_URL,
} from "../../../constants";
import { logger } from "../../../logger";
import AuthRequestParameters from "src/types/auth-request-parameters";
import { signToken } from "./sign-token";
import { IdTokenClaims } from "../../../types/id-token-claims";

export const createIdToken = async (
  authRequestParams: AuthRequestParameters,
  accessToken: string
): Promise<string> => {
  logger.info("Creating Id token");

  const clientConfig = Config.getInstance();
  const idTokenClaims = createIdTokenClaimSet(
    clientConfig,
    authRequestParams,
    accessToken
  );

  const signedIdToken = await signToken(idTokenClaims);

  logger.info("Id token created");

  return signedIdToken;
};

const createIdTokenClaimSet = (
  clientConfig: Config,
  authRequestParams: AuthRequestParameters,
  accessToken: string
): IdTokenClaims => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ID_TOKEN_EXPIRY;

  return {
    iat,
    exp,
    at_hash: generateAccessTokenHash(accessToken),
    sub: clientConfig.getSub(),
    aud: clientConfig.getClientId(),
    iss: ISSUER_VALUE,
    sid: SESSION_ID,
    vot: authRequestParams.vtr.credentialTrust,
    nonce: authRequestParams.nonce,
    vtm: TRUSTMARK_URL,
  };
};

const generateAccessTokenHash = (accessToken: string): string => {
  //This assumes our hashing algorithm will always be sha256
  //given we only support RS256 and ES256 I think this is correct
  const hash = createHash("sha256");
  const hashedToken = hash.update(Buffer.from(accessToken, "ascii")).digest();
  const firstHalf = hashedToken.subarray(0, Math.ceil(hashedToken.length / 2));
  return firstHalf.toString("base64url");
};
