export type CoreIdentityError =
  | "INVALID_ALG_HEADER"
  | "INVALID_SIGNATURE"
  | "INVALID_ISS"
  | "INVALID_AUD"
  | "INCORRECT_SUB"
  | "TOKEN_EXPIRED";
