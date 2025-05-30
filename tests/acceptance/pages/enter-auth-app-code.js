const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class EnterAuthAppCodePage extends BasePage {
    constructor(page) {
        super(page);
    }

    authAppCodeField = By.id("code");

    enterAuthAppCodeAndContinue = async () => {
        await this._enterAuthAppCode("");
        await this.findAndClickContinue();
    }

    _enterAuthAppCode = async (totpCode) => {
        await this.clearFieldAndEnter(this.authAppCodeField, totpCode);
    }
}