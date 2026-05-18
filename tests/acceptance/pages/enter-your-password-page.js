import BasePage from "./base-page.js";
import { By } from "selenium-webdriver";

export default class EnterYourPasswordPage extends BasePage {
  constructor(page) {
    super(page);
  }

  passwordField = By.id("password");

  enterPassword = async (password) => {
    await this.clearFieldAndEnter(this.passwordField, password);
  };

  enterPasswordAndContinue = async (password) => {
    await this.enterPassword(password);
    await this.findAndClickContinue();
  };
}
