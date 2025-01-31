const BasePage = require("./base-page.js");

module.exports = class RpStubUserInfoPage extends BasePage {
    constructor(page) {
        super(page);
    }

    getUserInfoData = async () => {
        const userInfoString = await this.getElementWithId("user-info-response");
        return await JSON.parse(userInfoString);
    }

    clickLogoutButton = async () => {
        await this.findAndClickButtonByText("Log out");
    }

    waitForStubUserInfoPageLoad = async () => {
        await this.waitForPageLoad("Example - GOV.UK - User Info");
    }
}