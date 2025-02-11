const { When, Then, world } = require('@cucumber/cucumber');
const { strictEqual } = require("node:assert");
const querystring = require("node:querystring");
const SIMULATOR_BASE_URL = "http://localhost:3000"
const SIMULATOR_REDIRECT_URL = "http://localhost:3001/callback";
const ONE_LOGIN_BASE_URL =  "https://oidc.integration.account.gov.uk"
const ONE_LOGIN_REDIRECT_URL =  "https://rp-integration.build.stubs.account.gov.uk/oidc/authorization-code/callback"


When("a request is made with no query params", async () => {
    world.simulatorResponse = await fetch(`${SIMULATOR_BASE_URL}/authorize`)
    world.oneLoginResponse = await fetch(`${ONE_LOGIN_BASE_URL}/authorize`)
})

When("a request is made with an unknown prompt", async () => {
    const params = {
        prompt: "login unknown",
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with an unknown prompt and no redirect uri", async () => {
    const params = {
        prompt: "login unknown",
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce"
    }
    await makeAuthorizeRequestWithParamsAndStoreResponses(params)
})

When("a request is made without a redirect uri", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid email phone",
        state: "test-state",
        nonce: "test-nonce"
    }

    await makeAuthorizeRequestWithParamsAndStoreResponses(params)
})


When("a request is made with a badly formatted redirect uri", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid email phone",
        state: "test-state",
        redirect_uri: ".notaredirectURI..",
    }

    await makeAuthorizeRequestWithParamsAndStoreResponses(params)
})


When("a request is made with an incorrect redirect uri", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid email phone",
        state: "test-state",
        redirect_uri: "https://example.com/redirect",
    }

    await makeAuthorizeRequestWithParamsAndStoreResponses(params)
})

When("a request is made with an unknown client_id", async () => {
    const params = {
        client_id: "unknown",
        response_type: "code",
        scope: "openid email phone",
        state: "test-state",
        redirect_uri: "https://example.com/redirect",
    }
    await makeAuthorizeRequestWithParamsAndStoreResponses(params)
})

When("a request is made without a scope", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        state: "test-state",
        none: "test-nonce"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with malformed claims", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce",
        claims: "{{}"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with a request uri", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce",
        request_uri: "https://example.com/request"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with an incorrect response type", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "id_token",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with an unknown scope", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid profile",
        state: "test-state",
        nonce: "test-nonce"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with an unknown claim", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce",
        claims: "{\"userinfo\":{\"unknownClaim\":null}}"
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made without a nonce", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

When("a request is made with an invalid VTR", async () => {
    const params = {
        client_id: "gjWNvoLYietMjeaOE6Zoww533u18ZUfr",
        response_type: "code",
        scope: "openid",
        state: "test-state",
        nonce: "test-nonce",
        vtr: '["Cl.Cm.P2","Cl.Cm"]'
    }
    await makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses(params)
})

Then("a matching response is returned", async () => {
    strictEqual(world.simulatorResponse.status, world.oneLoginResponse.status)
    strictEqual(await world.simulatorResponse.text(), await world.oneLoginResponse.text())
    if (world.simulatorResponse.status === 302) {
        const simulatorLocation = world.simulatorResponse.headers.get("location")
        const oneLoginLocation = world.oneLoginResponse.headers.get("location")
        strictEqual(simulatorLocation.split("?")[0], SIMULATOR_REDIRECT_URL)
        strictEqual(oneLoginLocation.split("?")[0], ONE_LOGIN_REDIRECT_URL)
        strictEqual(simulatorLocation.split("?")[1], oneLoginLocation.split("?")[1])
    }
})

const makeAuthorizeRequestWithParamsAndStoreResponses = async (params) => {
    const paramsString = querystring.stringify(params)
    world.simulatorResponse = await fetch(`${SIMULATOR_BASE_URL}/authorize?${paramsString}`)
    world.oneLoginResponse = await fetch(`${ONE_LOGIN_BASE_URL}/authorize?${paramsString}`)
}

const makeAuthorizeRequestWithParamsAndRedirectUrlsAndStoreResponses = async (params) => {
    const simulatorParams = querystring.stringify({
        ...params,
        redirect_uri: "http://localhost:3001/callback",
    })
    const oneLoginParams = querystring.stringify({
        ...params,
        redirect_uri: "https://rp-integration.build.stubs.account.gov.uk/oidc/authorization-code/callback",
    })
    world.simulatorResponse = await fetch(`${SIMULATOR_BASE_URL}/authorize?${simulatorParams}`, { redirect: "manual" })
    world.oneLoginResponse = await fetch(`${ONE_LOGIN_BASE_URL}/authorize?${oneLoginParams}`, { redirect: "manual" })
}