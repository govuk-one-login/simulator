const { By, until } = require('selenium-webdriver');

module.exports = class BasePage {
    RP_URL = process.env.RP_URL ?? "https://acceptance-test-rp-build.build.stubs.account.gov.uk/";
    SELENIUM_HEADLESS = process.env.SELENIUM_HEADLESS === "true";
    DEFAULT_PAGE_LOAD_WAIT_TIME = 20 * 1000;
    driver;

    constructor(page) {
        this.page = page
    }


    closeWebdriver = async ()=> {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }

    waitForPageLoad = async (titleContains) => {
        await this.page.wait(until.titleContains(titleContains), this.DEFAULT_PAGE_LOAD_WAIT_TIME);
        await this.waitForReadyStateComplete();
    }

    findAndClickContinue = async ()=> {
       await this.waitForReadyStateComplete();
       const continueButton = this.page.findElement(By.xpath("//button[text()[normalize-space() = 'Continue']]"));
       await continueButton.click();
    }

    findAndClickButtonByText = async (buttonText) => {
        await this.waitForReadyStateComplete();
        const button = this.page.findElement(
            By.xpath("//button[text()[normalize-space() = '" + buttonText + "']]"));
        await button.click();
    }

    waitForThisText = async (expectedText) => {
        await this.page.wait(until.elementIsVisible(
            this.page.findElement(
                By.xpath(
                    "//*[contains(text(), '" + expectedText + "')]"))));
    }

    clearFieldAndEnter = async (ele, text) => {
        await this.page.findElement(ele).clear();
        await this.page.findElement(ele).sendKeys(text);
    }

    waitForReadyStateComplete = async () => {
        const maxWaitTime = 10000; // 10 seconds
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const isPageLoaded = await this.page.executeScript("return document.readyState") === "complete";

            if (isPageLoaded) {
                return;
            }

            await this.page.pause(500);
        }

        throw new Error("Page did not load within the specified time.");
    };

    elementWithIdContainsText = async (elementId, text) => {
        await this.waitForReadyStateComplete();
        await this.page.findElement(By.xpath(`//*[contains(text(), '${text}') and @id='${elementId}']`));
    }
}