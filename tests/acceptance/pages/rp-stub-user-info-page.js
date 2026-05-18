import BasePage from "./base-page.js";

export default class RpStubUserInfoPage extends BasePage {
  constructor(page) {
    super(page);
  }

  getUserInfoDataWithoutCoreIdentityJwt = async () => {
    const userInfoString = await this.getElementWithId("user-info-response");
    const parsedUserinfo = JSON.parse(userInfoString);
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
  };

  waitForStubUserInfoPageLoad = async () => {
    await this.waitForPageLoad("Example - GOV.UK - User Info");
  };
}
