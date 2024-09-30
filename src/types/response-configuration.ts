import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import { bodyOptional } from "./util/body-helpers";

export default interface ResponseConfiguration {
  sub?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
}

export const generateResponseConfigurationPropertyValidators = (
  prefix: string = ""
): ValidationChain[] => {
  return [
    bodyOptional(`${prefix}${nameof<ResponseConfiguration>("sub")}`).isString(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("email")}`
    ).isString(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("emailVerified")}`
    ).isBoolean({ strict: true }),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("phoneNumber")}`
    ).isString(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("phoneNumberVerified")}`
    ).isBoolean({ strict: true }),
  ];
};
