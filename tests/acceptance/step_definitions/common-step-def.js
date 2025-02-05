const { When, Then } = require('@cucumber/cucumber');
const BasePage = require("../pages/base-page.js");

Then("the user is taken to the {string} page", async function (pageTitle){
    const page = new BasePage(this.driver);
    await page.waitForPageLoad(pageTitle);
});

When("the user clicks the continue button", async function () {
    const page = new BasePage(this.driver);
    await page.findAndClickContinue()
});
