import BasePage from "./base-page.js";
import { generateTotpCode } from "./../util/generate-totp.js";
import { By } from "selenium-webdriver";

export default class EnterAuthAppCodePage extends BasePage {
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
}
