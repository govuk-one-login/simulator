const RpStubStartPage = require("../pages/rp-stub-start-page.js");
const { When } = require("@cucumber/cucumber");


When("the user comes from the stub relying party with default options", async function () {
    const rpStubPage = new RpStubStartPage(this.driver);
    await rpStubPage.goToRpStubAndContinue();
});

When("the user comes from the stub relying party with options: {string}", async function (options){
    const rpStubPage = new RpStubStartPage(this.driver);
    await rpStubPage.goToRpStub();
    await rpStubPage.selectRpOptionsByIdAndContinue(options);
});