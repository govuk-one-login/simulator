import { CORE_IDENTITY_ERRORS } from "../constants.js";
import { CoreIdentityError } from "../types/core-identity-error.js";

export const isCoreIdentityError = (
  error: string
): error is CoreIdentityError => CORE_IDENTITY_ERRORS.includes(error);
