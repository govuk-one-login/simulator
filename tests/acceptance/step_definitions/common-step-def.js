const { When, Then } = require('@cucumber/cucumber');
const BasePage = require("../pages/base-page.js");
const { equal } = require("node:assert");

const TEST_USER_INFO_RESPONSE = {
    sub: process.env.TEST_USER_SUB,
    phone_number_verified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    email_verified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    email: process.env.TEST_USER_EMAIL,
};

const TEST_USER_INFO_REQUEST = {
    sub: process.env.TEST_USER_SUB,
    email: process.env.TEST_USER_EMAIL,
    emailVerified: process.env.TEST_USER_EMAIL_VERIFIED === "true",
    phoneNumberVerified: process.env.TEST_USER_PHONE_NUMBER_VERIFIED === "true",
    phoneNumber: ""
};

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

Then("the user logs out", async function () {
    const page = new BasePage(this.driver);
    await page.findAndClickButtonByText("Log out");
    await page.waitForPageLoad("Signed out");
});

Then("the RP receives the expected user info", async function () {
    const page = new BasePage(this.driver);
    await page.elementWithIdContainsText("user-info-response", JSON.stringify(TEST_USER_INFO_RESPONSE));
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

Then("the simulator returns the expected user info", async function () {
    const authorizeResponse = await fetch('http://localhost:3000/authorize?vtr=%5B%22Cl%22%5D&scope=openid+email+phone&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=QL1o9IKHyfTr4BpTCiMeROYKyd-8-k6vytO8OaUZspI&prompt=none&nonce=61SGsT-UYLpgIS2DmBKP-JUkMiqJx1jhe6mk8RpWjRQ&client_id=HGIOgho9HIRhgoepdIOPFdIUWgewi0jw');
    equal(await authorizeResponse.text(), JSON.stringify(TEST_USER_INFO_RESPONSE));
});
