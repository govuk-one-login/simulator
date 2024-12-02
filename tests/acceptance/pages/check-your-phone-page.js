const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class CheckYourPhonePage extends BasePage {
    constructor(page) {
        super(page);
    }

    phoneCodeField = By.id("code");

    enterCorrectPhoneCodeAndContinue = async () => {
        await this.enterPhoneCode(process.env.TEST_USER_PHONE_VERIFY_CODE ?? "");
        await this.findAndClickContinue();
    }

    enterPhoneCode = async (phoneCode) => {
        await this.clearFieldAndEnter(this.phoneCodeField, phoneCode);
    }
}