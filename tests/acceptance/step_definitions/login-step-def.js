const EnterYourPasswordPage = require("../pages/enter-your-password-page.js");
const EnterYourEmailAddressToSignInPage = require("../pages/enter-your-email-address-to-sign-in-page.js");
const CreateOrSignInPage = require("../pages/create-or-sign-in-page.js");
const { When } = require("@cucumber/cucumber");
const CheckYourPhonePage = require("../pages/check-your-phone-page");


When("the user selects sign in", async function () {
    await sleep(2000);
    const createOrSignInPage = new CreateOrSignInPage(this.driver);
    createOrSignInPage.clickSignInButton();
})

When("user enters {string} email address", async function (email) {
    const enterYourEmailAddressToSignInPage =
        new EnterYourEmailAddressToSignInPage(this.driver);
    await enterYourEmailAddressToSignInPage.enterEmailAddressAndContinue(process.env[email] ?? "");
});

When("the user enters their password", async function () {
    const enterYourPasswordPage = new EnterYourPasswordPage(this.driver);
    await enterYourPasswordPage.enterPasswordAndContinue(process.env.TEST_USER_PASSWORD ?? "");
});

When("the user enters the six digit security code from their phone", async function () {
    const checkYourPhonePage = new CheckYourPhonePage(this.driver);
    await checkYourPhonePage.enterCorrectPhoneCodeAndContinue();
});

const sleep = async (ms) => await new Promise(resolve => setTimeout(resolve, ms))