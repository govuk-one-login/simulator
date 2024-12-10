import { Request, Response } from "express";
import {
  UserIdentity,
  UserIdentityClaim,
  UserInfo,
} from "../../types/user-info";
import { userInfoRequestValidator } from "../../validators/user-info-request-validator";
import { Config } from "../../config";
import { UserInfoRequestError } from "../../errors/user-info-request-error";
import { importPKCS8, JWTPayload, SignJWT } from "jose";
import {
  EC_PRIVATE_IDENTITY_SIGNING_KEY,
  EC_PRIVATE_IDENTITY_SIGNING_KEY_ID,
} from "../../constants";
import { logger } from "../../logger";
import { randomBytes } from "crypto";
import { makeHeaderInvalid } from "../utils/make-header-invalid";
import { fakeSignature } from "../utils/fake-signature";

const AuthenticateHeaderKey: string = "www-authenticate";

export const userInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validationResult = await userInfoRequestValidator(req.headers);

  if (!validationResult.valid) {
    logger.error(
      `Access token failed validation with error: "${validationResult.error.error_code}".`
    );
    res.status(UserInfoRequestError.HTTP_STATUS_CODE);
    res.header(
      AuthenticateHeaderKey,
      validationResult.error.toAuthenticateHeader()
    );
    res.send();
    return;
  }

  logger.info("Successfully validated access token.");

  const config = Config.getInstance();

  const userInfo: UserInfo = {
    sub: config.getSub(),
  };

  if (validationResult.scopes.includes("email")) {
    userInfo.email = config.getEmail();
    userInfo.email_verified = config.getEmailVerified();
  }

  if (validationResult.scopes.includes("phone")) {
    userInfo.phone_number = config.getPhoneNumber() || undefined;
    userInfo.phone_number_verified = config.getPhoneNumberVerified();
  }

  const claims = validationResult.claims;
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/drivingPermit",
    config.getDrivingPermitDetails()
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/passport",
    config.getPassportDetails()
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/socialSecurityRecord",
    config.getSocialSecurityRecordDetails()
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/address",
    config.getPostalAddressDetails()
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/returnCode",
    config.getReturnCodes()
  );
  await tryAddCoreIdentityJwt(userInfo, claims, config);

  res.status(200);
  res.send(userInfo);
};

const tryAddClaim = (
  userInfo: UserIdentity,
  requestedClaims: UserIdentityClaim[],
  claim: UserIdentityClaim,
  claimData: any
): void => {
  if (requestedClaims.includes(claim)) {
    if (!claimData) {
      logger.warn(
        `Claim "${claim}" present in access token but not configured - ignored.`
      );
      return;
    }

    userInfo[claim] = claimData;
  }
};

const tryAddCoreIdentityJwt = async (
  userInfo: UserInfo,
  requestedClaims: UserIdentityClaim[],
  config: Config
): Promise<void> => {
  const claim: UserIdentityClaim =
    "https://vocab.account.gov.uk/v1/coreIdentityJWT";
  const vc = config.getVerifiableIdentityCredentials();
  const coreIdentityErrors = config.getCoreIdentityErrors();

  if (requestedClaims.includes(claim)) {
    if (!vc) {
      logger.warn(
        `Claim "${claim}" present in access token but vc not configured - ignored.`
      );
      return;
    }

    const timeNowSeconds = Math.floor(Date.now() / 1000);
    const oneDayTimeOffsetSeconds = 24 * 60 * 60;
    const coreIdentity = {
      vot: config.getMaxLoCAchieved(),
      vc: vc,
      vtm: config.getTrustmarkUrl(),
      iss: coreIdentityErrors.includes("INVALID_ISS")
        ? randomBytes(32).toString()
        : config.getIssuerValue(),
      sub: coreIdentityErrors.includes("INCORRECT_SUB")
        ? randomBytes(32).toString()
        : config.getSub(),
      nbf: timeNowSeconds,
      exp: coreIdentityErrors.includes("TOKEN_EXPIRED")
        ? timeNowSeconds - oneDayTimeOffsetSeconds
        : timeNowSeconds + oneDayTimeOffsetSeconds,
      aud: coreIdentityErrors.includes("INVALID_AUD")
        ? randomBytes(32).toString()
        : config.getClientId(),
      iat: timeNowSeconds,
    };

    const signingKey = await importPKCS8(EC_PRIVATE_IDENTITY_SIGNING_KEY, "EC");
    let coreIdentityJwt = await new SignJWT(coreIdentity as JWTPayload)
      .setProtectedHeader({
        kid: `${config.getDidController()}#${EC_PRIVATE_IDENTITY_SIGNING_KEY_ID}`,
        alg: "ES256",
      })
      .sign(signingKey);
    coreIdentityJwt = !coreIdentityErrors.includes("INVALID_ALG_HEADER")
      ? coreIdentityJwt
      : makeHeaderInvalid(coreIdentityJwt);

    coreIdentityJwt = !coreIdentityErrors.includes("INVALID_SIGNATURE")
      ? coreIdentityJwt
      : fakeSignature(coreIdentityJwt);
    userInfo[claim] = coreIdentityJwt;
  }
};
