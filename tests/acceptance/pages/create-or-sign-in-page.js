import BasePage from "./base-page.js";
import { By } from "selenium-webdriver";

export default class CreateOrSignInPage extends BasePage {
  constructor(page) {
    super(page);
  }

  signInButton = By.id("sign-in-button");

  clickSignInButton = () => {
    this.page.findElement(this.signInButton).click();
  };
}
