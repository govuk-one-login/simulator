import { ID_TOKEN_ERRORS } from "../constants";
import { IdTokenError } from "../types/id-token-error";

export const isIdTokenError = (error: string): error is IdTokenError =>
  ID_TOKEN_ERRORS.includes(error);
