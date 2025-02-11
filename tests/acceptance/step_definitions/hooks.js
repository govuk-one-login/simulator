const CustomWorld = require("../pages/custom-world.js");
const { After, Status, Before, setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const { setSimulatorClientId } = require('./simulator-step-def.js');

setWorldConstructor(CustomWorld);
setDefaultTimeout(30 * 1000);

Before(async function (scenario) {
    await this.init(scenario);
})

After(async function (scenario) {
    if (scenario.result?.status === Status.FAILED) {
        const screenshot = await this.driver.takeScreenshot();
        this.attach(screenshot, {
            mediaType: 'base64:image/png',
            fileName: 'Failure screenshot'
        });
    }
    await this.driver.quit();
})

After({ tags:'@ModifiesClientId' }, async function () {
    await setSimulatorClientId("HGIOgho9HIRhgoepdIOPFdIUWgewi0jw")
})