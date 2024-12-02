const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class EnterYourEmailAddressToSignInPage extends BasePage {
    constructor(page) {
        super(page);
    }

    emailField = By.id("email");

    enterEmailAddress = async (emailAddress) => {
        await this.clearFieldAndEnter(this.emailField, emailAddress);
    }

    enterEmailAddressAndContinue = async (emailAddress) => {
        await this.enterEmailAddress(emailAddress);
        await this.findAndClickContinue();
    }
}