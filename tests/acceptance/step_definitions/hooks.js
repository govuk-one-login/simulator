import CustomWorld from "../pages/custom-world.js";
import { After, Status, Before, setWorldConstructor, setDefaultTimeout } from "@cucumber/cucumber";

setWorldConstructor(CustomWorld);
setDefaultTimeout(60 * 1000); // 60 Seconds

Before(async function (scenario) {
  await this.init(scenario);
});

After(async function (scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.driver.takeScreenshot();
    this.attach(screenshot, {
      mediaType: "base64:image/png",
      fileName: "Failure screenshot",
    });
  }
  await this.driver.quit();
});
