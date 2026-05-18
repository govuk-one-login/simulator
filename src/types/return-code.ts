import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof.js";
import { bodyRequired } from "./util/body-helpers.js";

export default interface ReturnCode {
  code: string;
}

export const generateReturnCodePropertyValidators = (
  prefix: string = ""
): ValidationChain[] => {
  return [bodyRequired(`${prefix}${nameof<ReturnCode>("code")}`).isString()];
};
