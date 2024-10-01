import { createHash, randomBytes } from "crypto";
import { Config } from "../../../config";
import {
  ID_TOKEN_EXPIRY,
  INVALID_ISSUER,
  ONE_DAY_IN_SECONDS,
  SESSION_ID,
} from "../../../constants";
import { logger } from "../../../logger";
import AuthRequestParameters from "src/types/auth-request-parameters";
import { signToken } from "./sign-token";
import { IdTokenClaims } from "../../../types/id-token-claims";
import { fakeSignature } from "../../../components/utils/fake-signature";
import { makeHeaderInvalid } from "../../utils/make-header-invalid";

export const createIdToken = async (
  authRequestParams: AuthRequestParameters,
  accessToken: string
): Promise<string> => {
  logger.info("Creating Id token");
  const config = Config.getInstance();

  const idTokenClaims = createIdTokenClaimSet(
    config,
    authRequestParams,
    accessToken
  );

  const idTokenErrors = config.getIdTokenErrors();

  let signedIdToken = await signToken(idTokenClaims);

  if (idTokenErrors.includes("INVALID_ALG_HEADER")) {
    signedIdToken = makeHeaderInvalid(signedIdToken);
  }
  if (idTokenErrors.includes("INVALID_SIGNATURE")) {
    signedIdToken = fakeSignature(signedIdToken);
  }

  logger.info("Id token created");

  return signedIdToken;
};

const createIdTokenClaimSet = (
  config: Config,
  authRequestParams: AuthRequestParameters,
  accessToken: string
): IdTokenClaims => {
  const idTokenErrors = config.getIdTokenErrors();
  const timeNow = Math.floor(Date.now() / 1000);
  const iat = idTokenErrors.includes("TOKEN_NOT_VALID_YET")
    ? timeNow + ONE_DAY_IN_SECONDS
    : timeNow;
  const exp = idTokenErrors.includes("TOKEN_EXPIRED")
    ? timeNow - ONE_DAY_IN_SECONDS
    : timeNow + ID_TOKEN_EXPIRY;

  const vot = idTokenErrors.includes("INCORRECT_VOT")
    ? getOtherCredentialTrust(authRequestParams.vtr.credentialTrust)
    : authRequestParams.vtr.credentialTrust;

  return {
    iat,
    exp,
    at_hash: generateAccessTokenHash(accessToken),
    sub: config.getSub(),
    aud: idTokenErrors.includes("INVALID_AUD")
      ? randomBytes(32).toString()
      : config.getClientId(),
    iss: idTokenErrors.includes("INVALID_ISS")
      ? INVALID_ISSUER
      : config.getIssuerValue(),
    sid: SESSION_ID,
    vot,
    nonce: idTokenErrors.includes("NONCE_NOT_MATCHING")
      ? randomBytes(32).toString()
      : authRequestParams.nonce,
    vtm: config.getTrustmarkUrl(),
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

const getOtherCredentialTrust = (credentialTrust: string): string => {
  if (credentialTrust === "Cl.Cm") {
    return "Cl";
  } else return "Cl.Cm";
};
