const BasePage = require("./base-page.js");

module.exports = class RpStubUserInfoPage extends BasePage {
    constructor(page) {
        super(page);
    }

  getUserInfoDataWithoutCoreIdentityJwt = async () => {
    const userInfoString = await this.getElementWithId("user-info-response");
    const parsedUserinfo = JSON.parse(userInfoString);
    //Let's validate this one separately
    delete parsedUserinfo["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    return parsedUserinfo;
  };

  getCoreIdentityJwt = async () => {
    return await this.getElementWithId("user-info-core-identity-claim");
  };

  getIdToken = async () => {
    return await this.getElementWithId("user-info-id-token");
  };

    clickLogoutButton = async () => {
        await this.findAndClickButtonByText("Log out");
    }

    waitForStubUserInfoPageLoad = async () => {
        await this.waitForPageLoad("Example - GOV.UK - User Info");
    }
}