import { body, ValidationChain } from "express-validator";

export const bodyOptional = (path: string): ValidationChain => {
  return body(path).optional();
};
