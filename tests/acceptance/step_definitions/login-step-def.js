import EnterYourPasswordPage from "../pages/enter-your-password-page.js";
import EnterYourEmailAddressToSignInPage from "../pages/enter-your-email-address-to-sign-in-page.js";
import CreateOrSignInPage from "../pages/create-or-sign-in-page.js";
import { When } from "@cucumber/cucumber";
import EnterAuthAppCodePage from "../pages/enter-auth-app-code.js";

const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

When("the user selects sign in", async function () {
  await sleep(2000);
  const createOrSignInPage = new CreateOrSignInPage(this.driver);
  createOrSignInPage.clickSignInButton();
});

When("user enters {string} email address", async function (email) {
  const enterYourEmailAddressToSignInPage =
    new EnterYourEmailAddressToSignInPage(this.driver);
  await enterYourEmailAddressToSignInPage.enterEmailAddressAndContinue(
    process.env[email] ?? ""
  );
});

When("the user enters their password", async function () {
  const enterYourPasswordPage = new EnterYourPasswordPage(this.driver);
  await enterYourPasswordPage.enterPasswordAndContinue(
    process.env.TEST_USER_PASSWORD ?? ""
  );
});

When(
  "the user enters the six digit security code from their authenticator app",
  async function () {
    const checkYourPhonePage = new EnterAuthAppCodePage(this.driver);
    await checkYourPhonePage.enterAuthAppCodeAndContinue();
  }
);
