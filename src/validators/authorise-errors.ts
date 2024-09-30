import { AUTHORISE_ERRORS } from "../constants";
import { AuthoriseError } from "../types/authorise-errors";

export const isAuthoriseError = (error: string): error is AuthoriseError =>
  AUTHORISE_ERRORS.includes(error);
