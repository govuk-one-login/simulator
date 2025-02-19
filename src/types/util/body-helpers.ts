import { body, ValidationChain } from "express-validator";
import { logger } from "../../logger";
import ReturnCode from "../return-code";

export const bodyRequired = (path: string): ValidationChain => {
  const substrings = path.split(".");
  const parent = substrings.slice(0, -1).join(".");
  return body(path).if(body(parent).exists());
};

export const bodyOptional = (path: string): ValidationChain => {
  return body(path).optional();
};

export const bodyOptionalAllowNull = (path: string): ValidationChain => {
  return body(path).optional({ values: "null" });
};

export const bodyOptionalAllowEmptyFormSubmission = (
  path: string
): ValidationChain => {
  return body(path).optional({ values: "falsy" });
};

export const isOptionalJsonArray = (val: string): boolean => {
  try {
    return val ? Array.isArray(JSON.parse(val)) : true;
  } catch (error) {
    logger.error("Invalid JSON: " + (error as Error).message);

    return false;
  }
};

export const isOptionalJsonObject = (val: string): boolean => {
  if (!val) {
    return true;
  } else {
    try {
      const parsedJson = JSON.parse(val);
      return !Array.isArray(parsedJson) && typeof parsedJson === "object";
    } catch (error) {
      logger.error("Invalid JSON: " + (error as Error).message);
      return false;
    }
  }
};

export const isOptionalReturnCodeArray = (val: string): boolean => {
  try {
    const parsedVal = JSON.parse(val);

    if (!Array.isArray(parsedVal)) {
      return false;
    }
    return parsedVal.every(isReturnCode);
  } catch (error) {
    logger.error("Invalid JSON: " + (error as Error).message);

    return false;
  }
};

const isReturnCode = (arg: unknown): arg is ReturnCode => {
  const argAsReturnCode = arg as ReturnCode;
  return (
    typeof argAsReturnCode === "object" &&
    !Array.isArray(arg) &&
    typeof argAsReturnCode.code === "string" &&
    Object.keys(argAsReturnCode).length === 1
  );
};
