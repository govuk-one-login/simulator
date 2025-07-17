const AUTH_ONLY_RESPONSE = {
  sub: process.env.TEST_USER_SUB,
  phone_number_verified: false,
  email_verified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
  email: process.env.TEST_USER_EMAIL,
};

const AUTH_ONLY_REQUEST = {
  sub: process.env.TEST_USER_SUB,
  email: process.env.TEST_USER_EMAIL,
  emailVerified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
  phoneNumberVerified: false,
  phoneNumber: null,
};

module.exports = { AUTH_ONLY_RESPONSE, AUTH_ONLY_REQUEST };