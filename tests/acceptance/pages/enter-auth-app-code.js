const BasePage = require("./base-page.js");
const { generateTotpCode } = require("./../util/generate-totp.js");
const { By } = require("selenium-webdriver");

module.exports = class EnterAuthAppCodePage extends BasePage {
  constructor(page) {
    super(page);
  }

  authAppCodeField = By.id("code");

  enterAuthAppCodeAndContinue = async () => {
    const totpCode = generateTotpCode();
    await this._enterAuthAppCode(totpCode);
    await this.findAndClickContinue();
  };

  _enterAuthAppCode = async (totpCode) => {
    await this.clearFieldAndEnter(this.authAppCodeField, totpCode);
  };
};
