const RpStubPage = require("../pages/rp-stub-page.js");
const { When } = require("@cucumber/cucumber");


When("the user comes from the stub relying party with options: {string}", async function (options) {
    const rpStubPage = new RpStubPage(this.driver);
    await rpStubPage.goToRpStub();
    await rpStubPage.selectRpOptionsByIdAndContinue(options);
});