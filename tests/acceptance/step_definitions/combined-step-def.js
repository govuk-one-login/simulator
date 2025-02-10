const { When, Then, world } = require('@cucumber/cucumber');
const { strictEqual } = require("node:assert");
const querystring = require("node:querystring");
const SIMULATOR_BASE_URL = "http://localhost:3000"
const ONE_LOGIN_BASE_URL =  "https://oidc.integration.account.gov.uk"


When("a request is made with no query params", async () => {
    world.simulatorResponse = await fetch(`${SIMULATOR_BASE_URL}/authorize`)
    world.oneLoginResponse = await fetch(`${ONE_LOGIN_BASE_URL}/authorize`)
})

When("a request is made without the oidc scope", async () => {
    const params = querystring.stringify({
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "email phone",
        state: "test-state",
    })
    world.simulatorResponse = await fetch(`${SIMULATOR_BASE_URL}/authorize?${params}`)
    world.oneLoginResponse = await fetch(`${ONE_LOGIN_BASE_URL}/authorize?${params}`)


})

Then("a matching response is returned", async () => {
    strictEqual(world.oneLoginResponse.status, world.simulatorResponse.status)
    strictEqual(await world.oneLoginResponse.text(), await world.simulatorResponse.text())
})