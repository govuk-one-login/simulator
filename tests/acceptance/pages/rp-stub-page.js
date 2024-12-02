const { By } = require("selenium-webdriver");
const BasePage = require("./base-page.js");

module.exports = class RpStubPage extends BasePage {
    constructor(page) {
        super(page);
    }

    goToRpStub = async () => {
        await this.page.get(this.RP_URL.toString());
        await this.waitForThisText("Request Object");
    }

    selectRpOptionsByIdAndContinue = async (opts) => {
        if (opts && opts.toLowerCase() !== "default") {
            const ids = opts.split(",");
            for (const id of ids) {
                await this.page.findElement(By.id(id)).click();
            }
        }
        await this.findAndClickContinue();
    }
}