import { Then } from "@cucumber/cucumber";
import RpStubUserInfoPage from "../pages/rp-stub-user-info-page.js";
import { deepStrictEqual } from "node:assert";
import { AUTH_ONLY_RESPONSE } from "../data/auth-only.js";
import { IDENTITY_RESPONSE } from "../data/identity.js";
import { validateCoreIdentityJwt } from "../util/validate-core-identity-jwt.js";
import { validateIdToken } from "../util/validate-id-token.js";

Then("the user logs out", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  await page.clickLogoutButton();
  await page.waitForPageLoad("Signed out");
});

Then("the RP receives the expected auth-only user info", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const userInfoData = await page.getUserInfoDataWithoutCoreIdentityJwt();
  deepStrictEqual(userInfoData, AUTH_ONLY_RESPONSE, new Error("Auth only userinfo did not match"));
});

Then("the RP receives the expected identity user info", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const userInfoData = await page.getUserInfoDataWithoutCoreIdentityJwt();
  deepStrictEqual(userInfoData, IDENTITY_RESPONSE, new Error("Identity userinfo did not match"));
});

Then("the RP receives a valid ID Token", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const encodedJWT = await page.getIdToken();
  await validateIdToken(encodedJWT, true);
});

Then("the RP receives a valid ID Token from the simulator", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const encodedJWT = await page.getIdToken();
  await validateIdToken(encodedJWT, false);
});

Then("the RP receives a valid CoreIdentityJWT", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const encodedJWT = await page.getCoreIdentityJwt();
  await validateCoreIdentityJwt(encodedJWT, true);
});

Then("the RP receives a valid CoreIdentityJWT from the simulator", async function () {
  const page = new RpStubUserInfoPage(this.driver);
  const encodedJWT = await page.getCoreIdentityJwt();
  await validateCoreIdentityJwt(encodedJWT, false);
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
