import { ID_TOKEN_ERRORS } from "../constants.js";
import { IdTokenError } from "../types/id-token-error.js";

export const isIdTokenError = (error: string): error is IdTokenError =>
  ID_TOKEN_ERRORS.includes(error);
