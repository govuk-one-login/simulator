const { When, Then } = require('@cucumber/cucumber');
const BasePage = require("../pages/base-page.js");
const { deepStrictEqual } = require("node:assert");
const { PASSPORT } = require("../data/passport");
const { ADDRESS } = require("../data/address");

const TEST_USER_INFO_RESPONSE = {
    sub: process.env.TEST_USER_SUB,
    phone_number_verified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phone_number: process.env.TEST_USER_PHONE_NUMBER,
    email_verified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    email: process.env.TEST_USER_EMAIL,
};

const TEST_USER_INFO_REQUEST = {
    sub: process.env.TEST_USER_SUB,
    email: process.env.TEST_USER_EMAIL,
    emailVerified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    phoneNumberVerified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phoneNumber: process.env.TEST_USER_PHONE_NUMBER,
};

const TEST_USER_INFO_IDENTITY_REQUEST = { ...TEST_USER_INFO_REQUEST,
    coreIdentityVerifiableCredentials: "STUB_IDENTITY",
    passportDetails: PASSPORT,
    postalAddressDetails: ADDRESS,
}

const TEST_USER_INFO_IDENTITY_RESPONSE = {
    sub: process.env.TEST_USER_SUB,
    "https:\\/\\/vocab.account.gov.uk\\/v1\\/passport": PASSPORT,
    emailVerified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    phoneNumberVerified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phoneNumber: process.env.TEST_USER_PHONE_NUMBER,
    "https:\\/\\/vocab.account.gov.uk\\/v1\\/coreIdentityJWT": "STUB_IDENTITY",
    "https:\\/\\/vocab.account.gov.uk\\/v1\\/address": ADDRESS,
    email: process.env.TEST_USER_EMAIL,
}

Then("the user is taken to the {string} page", async function (pageTitle){
    const page = new BasePage(this.driver);
    await page.waitForPageLoad(pageTitle);
});

When("the user clicks the continue button", async function () {
    const page = new BasePage(this.driver);
    await page.findAndClickContinue()
});

Then("the user is returned to the service", async function () {
    const page = new BasePage(this.driver);
    await page.waitForPageLoad("Example - GOV.UK - User Info");
});

Then("the user is returned to the service via processing identity", { timeout: 60 * 1000 }, async function () {
    const page = new BasePage(this.driver);
    await page.waitForPageLoad("Example - GOV.UK - User Info");
});

Then("the user logs out", async function () {
    const page = new BasePage(this.driver);
    await page.findAndClickButtonByText("Log out");
    await page.waitForPageLoad("Signed out");
});

Then("the RP receives the expected auth only user info", async function () {
    const page = new BasePage(this.driver);
    await page.elementWithIdContainsText("user-info-response", JSON.stringify(TEST_USER_INFO_RESPONSE));
});

Then("the RP receives the expected identity user info", async function () {
    const page = new BasePage(this.driver);
    await page.elementWithIdContainsText("user-info-response", JSON.stringify(TEST_USER_INFO_IDENTITY_RESPONSE));
});

When("the simulator is sent the configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "responseConfiguration": TEST_USER_INFO_REQUEST
        }),
    };
    await fetch('http://localhost:3000/config', configRequestOptions);
})

When("the simulator is sent the identity configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "responseConfiguration": TEST_USER_INFO_IDENTITY_REQUEST
        }),
    };
    await fetch('http://localhost:3000/config', configRequestOptions);
})

Then("the simulator returns the expected auth only user info", async function () {
    const authorizeResponse = await fetch('http://localhost:3000/authorize?vtr=%5B%22Cl.Cm%22%5D&scope=openid+email+phone&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=QL1o9IKHyfTr4BpTCiMeROYKyd-8-k6vytO8OaUZspI&prompt=none&nonce=61SGsT-UYLpgIS2DmBKP-JUkMiqJx1jhe6mk8RpWjRQ&client_id=HGIOgho9HIRhgoepdIOPFdIUWgewi0jw');
    deepStrictEqual(await authorizeResponse.json(), TEST_USER_INFO_RESPONSE);
});

Then("the simulator returns the expected identity user info", async function () {
    const authorizeResponse = await fetch('http://localhost:3000/authorize?vtr=%5B%22P2.Cl.Cm%22%5D&scope=openid+email+phone&claims=%7B%22userinfo%22%3A%7B%22https%3A%5C%2F%5C%2Fvocab.account.gov.uk%5C%2Fv1%5C%2Fpassport%22%3A%7B%22essential%22%3Atrue%7D%2C%22https%3A%5C%2F%5C%2Fvocab.account.gov.uk%5C%2Fv1%5C%2FcoreIdentityJWT%22%3A%7B%22essential%22%3Atrue%7D%2C%22https%3A%5C%2F%5C%2Fvocab.account.gov.uk%5C%2Fv1%5C%2Faddress%22%3A%7B%22essential%22%3Atrue%7D%7D%7D&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=QL1o9IKHyfTr4BpTCiMeROYKyd-8-k6vytO8OaUZspI&prompt=none&nonce=61SGsT-UYLpgIS2DmBKP-JUkMiqJx1jhe6mk8RpWjRQ&client_id=HGIOgho9HIRhgoepdIOPFdIUWgewi0jw');
    deepStrictEqual(await authorizeResponse.json(), TEST_USER_INFO_IDENTITY_RESPONSE);
});
