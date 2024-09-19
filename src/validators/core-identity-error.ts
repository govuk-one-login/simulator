import { CORE_IDENTITY_ERRORS } from "../constants";
import { CoreIdentityError } from "../types/core-identity-error";

export const isCoreIdentityError = (
  error: string
): error is CoreIdentityError => CORE_IDENTITY_ERRORS.includes(error);
