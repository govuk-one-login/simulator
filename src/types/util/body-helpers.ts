import { body, ValidationChain } from "express-validator";

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
