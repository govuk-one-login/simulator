const { AUTH_ONLY_REQUEST, AUTH_ONLY_RESPONSE } = require("./auth-only");
const { PASSPORT } = require("./passport");
const { ADDRESS } = require("./address");
const { CORE_IDENTITY_VC_CLAIM } = require("./core-identity-vc");

const IDENTITY_REQUEST = { ...AUTH_ONLY_REQUEST,
    passportDetails: PASSPORT,
    postalAddressDetails: ADDRESS,
    coreIdentityVerifiableCredentials: CORE_IDENTITY_VC_CLAIM
}

const IDENTITY_RESPONSE = {
    ...AUTH_ONLY_RESPONSE,
    "https://vocab.account.gov.uk/v1/address": ADDRESS,
    "https://vocab.account.gov.uk/v1/passport": PASSPORT,
}

module.exports = { IDENTITY_REQUEST, IDENTITY_RESPONSE }