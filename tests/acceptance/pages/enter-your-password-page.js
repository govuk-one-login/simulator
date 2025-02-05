const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class EnterYourPasswordPage extends BasePage {
    constructor(page) {
        super(page);
    }

    passwordField = By.id("password");

    enterPassword = async (password) => {
        await this.clearFieldAndEnter(this.passwordField, password);
    }

    enterPasswordAndContinue = async (password) => {
        await this.enterPassword(password);
        await this.findAndClickContinue();
    }
}