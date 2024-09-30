import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import { bodyRequired } from "./util/body-helpers";

export default interface ReturnCode {
  code: string;
}

export const generateReturnCodePropertyValidators = (
  prefix: string = ""
): ValidationChain[] => {
  return [bodyRequired(`${prefix}${nameof<ReturnCode>("code")}`).isString()];
};
