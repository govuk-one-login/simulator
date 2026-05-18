import BasePage from "./base-page.js";
import { By } from "selenium-webdriver";

export default class EnterYourEmailAddressToSignInPage extends BasePage {
  constructor(page) {
    super(page);
  }

  emailField = By.id("email");

  enterEmailAddress = async (emailAddress) => {
    await this.clearFieldAndEnter(this.emailField, emailAddress);
  };

  enterEmailAddressAndContinue = async (emailAddress) => {
    await this.enterEmailAddress(emailAddress);
    await this.findAndClickContinue();
  };
}
