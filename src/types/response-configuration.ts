import ReturnCode, {
  generateReturnCodePropertyValidators,
} from "./return-code";
import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import { bodyOptional, bodyOptionalAllowNull } from "./util/body-helpers";
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
