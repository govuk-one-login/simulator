const { Then } = require("@cucumber/cucumber");
const RpStubUserInfoPage = require("../pages/rp-stub-user-info-page");
const { deepStrictEqual } = require("node:assert");
const { AUTH_ONLY_RESPONSE } = require("../data/auth-only");
const { IDENTITY_RESPONSE } = require("../data/identity");
const {
  validateCoreIdentityJwt,
} = require("../util/validate-core-identity-jwt");

Then("the user logs out", async function () {
    const page = new RpStubUserInfoPage(this.driver);
    await page.clickLogoutButton();
    await page.waitForPageLoad("Signed out");
});

Then("the RP receives the expected auth-only user info", async function () {
    const page = new RpStubUserInfoPage(this.driver);
    const userInfoData = await page.getUserInfoDataWithoutCoreIdentityJwt();
    deepStrictEqual(userInfoData, AUTH_ONLY_RESPONSE);
});

Then("the RP receives the expected identity user info", async function () {
    const page = new RpStubUserInfoPage(this.driver);
    const userInfoData = await page.getUserInfoDataWithoutCoreIdentityJwt();
    deepStrictEqual(userInfoData, IDENTITY_RESPONSE);
});

Then("the RP receives a valid CoreIdentityJWT", async function () {
    const page = new RpStubUserInfoPage(this.driver);
    const encodedJWT = await page.getCoreIdentityJwt();
    await validateCoreIdentityJwt(encodedJWT, true);
});

Then("the user is returned to the service", async function () {
    const page = new RpStubUserInfoPage(this.driver);
    await page.waitForStubUserInfoPageLoad();
});

// This is used when waiting to be returned to the service via SPoT where there is a wait
Then("the user is returned to the service with extended timeout", { timeout: 60 * 1000 }, async function () {
    const page = new RpStubUserInfoPage(this.driver);
    await page.waitForStubUserInfoPageLoad();
});