import { Request, Response } from "express";
import { UserInfo } from "../../types/user-info";
import { userInfoRequestValidator } from "../../validators/user-info-request-validator";
import { Config } from "../../config";
import { UserInfoRequestError } from "../../errors/user-info-request-error";

const AuthenticateHeaderKey: string = "www-authenticate";

export const userInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validationResult = await userInfoRequestValidator(req.headers);

  if (!validationResult.valid) {
    res.status(UserInfoRequestError.HTTP_STATUS_CODE);
    res.header(
      AuthenticateHeaderKey,
      validationResult.error.toAuthenticateHeader()
    );
    res.send();
    return;
  }

  const config = Config.getInstance();

  const userInfo: UserInfo = {
    sub: config.getSub(),
    email: config.getEmail(),
    email_verified: config.getEmailVerified(),
    phone_number: config.getPhoneNumber(),
    phone_number_verified: config.getPhoneNumberVerified(),
  };

  res.status(200);
  res.send(userInfo);
};
