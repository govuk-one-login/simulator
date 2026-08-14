import BasePage from "./base-page.js";

export default class CreatePassKeyPage extends BasePage {
  constructor(page) {
    super(page);
  }

  shouldOptionallySkipPassKeyPrompt = async () => {
    if ((await this.page.getCurrentUrl()).includes("/create-passkey")) {
      await this.findAndClickButtonByText("Skip for now");
    }
  };
};
