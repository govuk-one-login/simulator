import { AUTHORISE_ERRORS } from "../constants.js";
import { AuthoriseError } from "../types/authorise-errors.js";

export const isAuthoriseError = (error: string): error is AuthoriseError =>
  AUTHORISE_ERRORS.includes(error);
