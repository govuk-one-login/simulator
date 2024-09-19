import { CoreIdentityError } from "./core-identity-error";
import { IdTokenError } from "./id-token-error";

export type ErrorConfiguration = {
  coreIdentityErrors: CoreIdentityError[];
  idTokenErrors: IdTokenError[];
};
