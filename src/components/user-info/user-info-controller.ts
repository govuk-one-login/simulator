import { Request, Response } from "express";
import {
  UserIdentity,
  UserIdentityClaim,
  UserInfo,
} from "../../types/user-info";
import { userInfoRequestValidator } from "../../validators/user-info-request-validator";
import { Config } from "../../config";
import { UserInfoRequestError } from "../../errors/user-info-request-error";
import { importPKCS8, SignJWT } from "jose";
import {
  EC_PRIVATE_IDENTITY_SIGNING_KEY,
  EC_PRIVATE_IDENTITY_SIGNING_KEY_ID,
} from "../../constants";
import { logger } from "../../logger";
import { randomBytes } from "crypto";
import { makeHeaderInvalid } from "../utils/make-header-invalid";
import { fakeSignature } from "../utils/fake-signature";
import { getAccessTokenFromHeaders } from "../../utils/utils";
import ResponseConfiguration from "../../types/response-configuration";

const AuthenticateHeaderKey: string = "www-authenticate";

export const userInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authorisationHeader = req.headers.authorization;

  if (!authorisationHeader) {
    logger.warn("Missing authorisation header.");
    res.status(UserInfoRequestError.HTTP_STATUS_CODE);
    res.header(
      AuthenticateHeaderKey,
      UserInfoRequestError.MISSING_TOKEN.toAuthenticateHeader()
    );
    res.send();
    return;
  }

  const accessToken = getAccessTokenFromHeaders(authorisationHeader);

  const validationResult = await userInfoRequestValidator(accessToken);

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

  let userInfo: UserInfo;

  if (config.isInteractiveModeEnabled()) {
    //Our previous validator checked this value exists
    const responseConfig = config.getResponseConfigurationForAccessToken(
      accessToken as string
    ) as ResponseConfiguration;

    userInfo = await constructUserInfo(
      responseConfig.sub as string,
      validationResult.scopes,
      validationResult.claims,
      responseConfig,
      config
    );
  } else {
    userInfo = await constructUserInfo(
      config.getSub(),
      validationResult.scopes,
      validationResult.claims,
      config.getResponseConfiguration(),
      config
    );
  }

  res.status(200);
  res.send(userInfo);
};

const constructUserInfo = async (
  sub: string,
  scopes: string[],
  claims: UserIdentityClaim[],
  responseConfig: ResponseConfiguration,
  config: Config
): Promise<UserInfo> => {
  const userInfo: UserInfo = {
    sub,
  };

  if (scopes.includes("email")) {
    userInfo.email = responseConfig.email;
    userInfo.email_verified = responseConfig.emailVerified;
  }

  if (scopes.includes("phone")) {
    userInfo.phone_number = responseConfig.phoneNumber ?? undefined;
    userInfo.phone_number_verified = responseConfig.phoneNumberVerified;
  }

  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/drivingPermit",
    responseConfig.drivingPermitDetails
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/passport",
    responseConfig.passportDetails
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/address",
    responseConfig.postalAddressDetails
  );
  tryAddClaim(
    userInfo,
    claims,
    "https://vocab.account.gov.uk/v1/returnCode",
    responseConfig.returnCodes
  );

  await tryAddCoreIdentityJwt(userInfo, claims, config, responseConfig);
  return userInfo;
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
  config: Config,
  responseConfig: ResponseConfiguration
): Promise<void> => {
  const claim: UserIdentityClaim =
    "https://vocab.account.gov.uk/v1/coreIdentityJWT";
  const vc = responseConfig.coreIdentityVerifiableCredentials;
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
      vot: responseConfig.maxLoCAchieved,
      vc: vc,
      vtm: config.getTrustmarkUrl(),
      iss: coreIdentityErrors.includes("INVALID_ISS")
        ? randomBytes(32).toString()
        : config.getIssuerValue(),
      sub: coreIdentityErrors.includes("INCORRECT_SUB")
        ? randomBytes(32).toString()
        : responseConfig.sub,
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
    let coreIdentityJwt = await new SignJWT(coreIdentity)
      .setProtectedHeader({
        kid: `${config.getDidController()}#${EC_PRIVATE_IDENTITY_SIGNING_KEY_ID}`,
        alg: "ES256",
      })
      .sign(signingKey);
    coreIdentityJwt = !coreIdentityErrors.includes("INVALID_ALG_HEADER")
      ? coreIdentityJwt
      : makeHeaderInvalid(coreIdentityJwt, config.getDidController());

    coreIdentityJwt = !coreIdentityErrors.includes("INVALID_SIGNATURE")
      ? coreIdentityJwt
      : fakeSignature(coreIdentityJwt);
    userInfo[claim] = coreIdentityJwt;
  }
};
