import { Request, Response } from "express";
import { Config } from "../../config";
import { base64url } from "jose";
import AuthRequestParameters from "src/types/auth-request-parameters";
import ResponseConfiguration from "src/types/response-configuration";
import { validationResult } from "express-validator";
import { logger } from "../../logger";

export const formSubmitController = (req: Request, res: Response): void => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.error(errors);
      const formattedErrors = errors
        .array()
        .map((err: any) => ({ field: err.path, message: err.msg }));
      res.status(400);
      res.json({
        error: "Invalid request",
        invalid_fields: formattedErrors,
      });
      return;
    }
    const config = Config.getInstance();
    const formBody = req.body;
    const authCode = formBody.authCode;
    const authRequestParams: AuthRequestParameters = JSON.parse(
      Buffer.from(base64url.decode(formBody.authRequestParams)).toString()
    );

    const responseConfiguration: ResponseConfiguration = {
      sub: formBody.sub,
      email: formBody.email ? formBody.email : null,
      emailVerified: formBody.emailVerified === "true",
      phoneNumber: formBody.phoneNumber,
      phoneNumberVerified: formBody.phoneNumberVerified === "true",
      maxLoCAchieved: formBody.maxLoCAchieved,
      coreIdentityVerifiableCredentials: JSON.parse(
        formBody.coreIdentityVerifiableCredentials
      ),
      passportDetails: formBody.passportDetails
        ? JSON.parse(formBody.passportDetails)
        : null,
      drivingPermitDetails: formBody.drivingPermitDetails
        ? JSON.parse(formBody.drivingPermitDetails)
        : null,
      postalAddressDetails: formBody.postalAddressDetails
        ? JSON.parse(formBody.postalAddressDetails)
        : null,
      returnCodes: formBody.returnCodes
        ? JSON.parse(formBody.returnCodes)
        : null,
    };

    config.addToAuthCodeRequestParamsStore(authCode, {
      ...authRequestParams,
      responseConfiguration,
    });
    res.redirect(
      `${authRequestParams.redirectUri}?code=${formBody.authCode}&state=${formBody.state}`
    );
  } catch (error) {
    logger.error(
      `Failed to put form configuration: ${(error as Error).message}`
    );
    res.status(400);
    res.json({
      error: "Invalid request: Invalid JSON",
    });
  }
};
