const { World } = require('@cucumber/cucumber');
const { Options } = require('selenium-webdriver/chrome.js');
const { Builder } = require("selenium-webdriver");

module.exports = class CustomWorld extends World {
    driver = null
    SELENIUM_LOCAL = process.env.SELENIUM_LOCAL === "true";
    SELENIUM_URL =
        process.env.SELENIUM_URL ?? "http://localhost:4444/wd/hub";

    async init() {
        const chromeOptions = new Options();
        chromeOptions.addArguments("--remote-allow-origins=*");
        chromeOptions.addArguments("--disable-gpu");
        chromeOptions.addArguments("--disable-extensions");
        chromeOptions.addArguments("--no-sandbox");
        chromeOptions.addArguments("--disable-dev-shm-usage");
        if (this.SELENIUM_HEADLESS) {
            chromeOptions.addArguments("--headless");
        }
        this.driver = this.SELENIUM_LOCAL
            ? await new Builder().setChromeOptions(chromeOptions).build()
            : new Builder().usingServer(this.SELENIUM_URL).setChromeOptions(chromeOptions).build();
    }
}