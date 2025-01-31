const AUTH_ONLY_RESPONSE = {
    sub: process.env.TEST_USER_SUB,
    phone_number_verified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phone_number: process.env.TEST_USER_PHONE_NUMBER,
    email_verified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    email: process.env.TEST_USER_EMAIL,
};

const AUTH_ONLY_REQUEST = {
    sub: process.env.TEST_USER_SUB,
    email: process.env.TEST_USER_EMAIL,
    emailVerified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    phoneNumberVerified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phoneNumber: process.env.TEST_USER_PHONE_NUMBER,
};

module.exports = { AUTH_ONLY_RESPONSE, AUTH_ONLY_REQUEST };