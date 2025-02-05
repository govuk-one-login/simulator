const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class CreateOrSignInPage extends BasePage {
    constructor(page) {
        super(page);
    }
    signInButton = By.id("sign-in-button");

    clickSignInButton = () => {
        this.page.findElement(this.signInButton).click();
    }
}