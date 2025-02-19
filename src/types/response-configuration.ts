import ReturnCode, {
  generateReturnCodePropertyValidators,
} from "./return-code";
import { body, ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import {
  bodyOptional,
  bodyOptionalAllowEmptyFormSubmission,
  bodyOptionalAllowNull,
  isOptionalJsonArray,
  isOptionalJsonObject,
  isOptionalReturnCodeArray,
} from "./util/body-helpers";
import { VALID_LOC_VALUES } from "../constants";

export default interface ResponseConfiguration {
  sub?: string;
  email?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  maxLoCAchieved?: string;
  coreIdentityVerifiableCredentials?: object | null;
  passportDetails?: object[] | null;
  drivingPermitDetails?: object[] | null;
  postalAddressDetails?: object[] | null;
  returnCodes?: ReturnCode[] | null;
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
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("maxLoCAchieved")}`
    ).isIn(VALID_LOC_VALUES),
    bodyOptionalAllowNull(
      `${prefix}${nameof<ResponseConfiguration>("coreIdentityVerifiableCredentials")}`
    ).isObject(),
    bodyOptionalAllowNull(
      `${prefix}${nameof<ResponseConfiguration>("passportDetails")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("passportDetails")}.*`
    ).isObject(),
    bodyOptionalAllowNull(
      `${prefix}${nameof<ResponseConfiguration>("drivingPermitDetails")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("drivingPermitDetails")}.*`
    ).isObject(),
    bodyOptionalAllowNull(
      `${prefix}${nameof<ResponseConfiguration>("postalAddressDetails")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ResponseConfiguration>("postalAddressDetails")}.*`
    ).isObject(),
    bodyOptionalAllowNull(
      `${prefix}${nameof<ResponseConfiguration>("returnCodes")}`
    ).isArray(),
    ...generateReturnCodePropertyValidators(
      `${prefix}${nameof<ResponseConfiguration>("returnCodes")}.*.`
    ),
  ];
};

export const generateConfigFormFieldValidator = (): ValidationChain[] => {
  return [
    body("sub")
      .isString()
      .notEmpty()
      .withMessage("Subject claim is a required field"),
    bodyOptionalAllowEmptyFormSubmission("email")
      .isString()
      .withMessage("Invalid Email"),
    bodyOptionalAllowEmptyFormSubmission("emailVerified").isBoolean({
      loose: true,
    }),
    bodyOptionalAllowEmptyFormSubmission("phoneNumber").isString(),
    bodyOptionalAllowEmptyFormSubmission("phoneNumberVerified").isBoolean({
      loose: true,
    }),
    bodyOptional("maxLoCAchieved")
      .isIn(VALID_LOC_VALUES)
      .withMessage("Invalid Level of Confidence"),
    bodyOptionalAllowEmptyFormSubmission("coreIdentityVerifiableCredentials")
      .isJSON()
      .custom(isOptionalJsonObject)
      .withMessage("Invalid CoreIdentity Verifiable Credential"),
    bodyOptionalAllowEmptyFormSubmission("passportDetails")
      .isJSON()
      .custom(isOptionalJsonArray)
      .withMessage("Invalid Passport Details"),
    bodyOptionalAllowEmptyFormSubmission("drivingPermitDetails")
      .isJSON()
      .custom(isOptionalJsonArray)
      .withMessage("Invalid Driving Permit details"),
    bodyOptionalAllowEmptyFormSubmission("postalAddressDetails")
      .isJSON()
      .custom(isOptionalJsonArray)
      .withMessage("Invalid Postal Address details"),
    bodyOptionalAllowEmptyFormSubmission("returnCodes")
      .isJSON()
      .custom(isOptionalReturnCodeArray)
      .withMessage("Invalid Return Codes"),
  ];
};
