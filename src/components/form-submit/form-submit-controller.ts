import { Request, Response } from "express";
import { Config } from "../../config";
import { base64url } from "jose";
import AuthRequestParameters from "src/types/auth-request-parameters";
import ResponseConfiguration from "src/types/response-configuration";

export const formSubmitController = (req: Request, res: Response): void => {
  const config = Config.getInstance();
  const formBody = req.body;
  const authCode = formBody.authCode;
  const authRequestParams: AuthRequestParameters = JSON.parse(
    Buffer.from(base64url.decode(formBody.authRequestParams)).toString()
  );

  const responseConfiguration: ResponseConfiguration = {
    sub: formBody.sub,
    email: formBody.email,
    emailVerified: formBody.emailVerified === "true",
    phoneNumber: formBody.phoneNumber,
    phoneNumberVerified: formBody.phoneNumberVerified === "true",
    maxLoCAchieved: formBody.maxLoCAchieved,
    coreIdentityVerifiableCredentials:
      formBody.coreIdentityVerifiableCredentials,
    passportDetails: formBody.passportDetails,
    drivingPermitDetails: formBody.drivingPermitDetails,
    postalAddressDetails: formBody.postalAddressDetails,
    returnCodes: formBody.returnCodes,
  };

  config.addToAuthCodeRequestParamsStore(authCode, {
    ...authRequestParams,
    responseConfiguration,
  });
  res.redirect(
    `${authRequestParams.redirectUri}?code=${formBody.authCode}&state=${formBody.state}`
  );
};
