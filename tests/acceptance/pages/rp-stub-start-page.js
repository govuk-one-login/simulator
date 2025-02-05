const BasePage = require("./base-page.js");
const { By } = require("selenium-webdriver");

module.exports = class RpStubStartPage extends BasePage {
    constructor(page) {
        super(page);
    }

    goToRpStubAndContinue = async () => {
        await this.page.get(this.RP_URL.toString());
        await this.waitForThisText("Request Object");
        await this.findAndClickContinue();
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