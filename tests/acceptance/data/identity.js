import { AUTH_ONLY_REQUEST, AUTH_ONLY_RESPONSE } from "./auth-only.js";
import { PASSPORT } from "./passport.js";
import { ADDRESS } from "./address.js";
import { CORE_IDENTITY_VC_CLAIM } from "./core-identity-vc.js";

export const IDENTITY_REQUEST = {
  ...AUTH_ONLY_REQUEST,
  passportDetails: PASSPORT,
  postalAddressDetails: ADDRESS,
  coreIdentityVerifiableCredentials: CORE_IDENTITY_VC_CLAIM,
};

export const IDENTITY_RESPONSE = {
  ...AUTH_ONLY_RESPONSE,
  "https://vocab.account.gov.uk/v1/address": ADDRESS,
  "https://vocab.account.gov.uk/v1/passport": PASSPORT,
};
