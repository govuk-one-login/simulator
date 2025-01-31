const { When, Then } = require("@cucumber/cucumber");
const { deepStrictEqual } = require("node:assert");
const { AUTH_ONLY_REQUEST, AUTH_ONLY_RESPONSE } = require("../data/auth-only");
const { IDENTITY_REQUEST, IDENTITY_RESPONSE } = require("../data/identity");

When("the simulator is sent the configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "responseConfiguration": AUTH_ONLY_REQUEST
        }),
    };
    await fetch('http://localhost:3000/config', configRequestOptions);
})

When("the simulator is sent the identity configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "responseConfiguration": IDENTITY_REQUEST
        }),
    };
    await fetch('http://localhost:3000/config', configRequestOptions);
})

Then("the simulator returns the expected auth-only user info", async function () {
    const authorizeResponse = await fetch('http://localhost:3000/authorize?vtr=%5B%22Cl.Cm%22%5D&scope=openid+email+phone&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=QL1o9IKHyfTr4BpTCiMeROYKyd-8-k6vytO8OaUZspI&prompt=none&nonce=61SGsT-UYLpgIS2DmBKP-JUkMiqJx1jhe6mk8RpWjRQ&client_id=HGIOgho9HIRhgoepdIOPFdIUWgewi0jw');
    deepStrictEqual(await authorizeResponse.json(), AUTH_ONLY_RESPONSE);
});

Then("the simulator returns the expected identity user info", async function () {
    const authorizeResponse = await fetch('http://localhost:3000/authorize?vtr=%5B%22P2.Cl.Cm%22%5D&scope=openid+email+phone&claims=%7B%22userinfo%22%3A%7B%22https%3A%5C%2F%5C%2Fvocab.account.gov.uk%5C%2Fv1%5C%2Fpassport%22%3A%7B%22essential%22%3Atrue%7D%2C%22https%3A%5C%2F%5C%2Fvocab.account.gov.uk%5C%2Fv1%5C%2Faddress%22%3A%7B%22essential%22%3Atrue%7D%7D%7D&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fcallback&state=QL1o9IKHyfTr4BpTCiMeROYKyd-8-k6vytO8OaUZspI&prompt=none&nonce=61SGsT-UYLpgIS2DmBKP-JUkMiqJx1jhe6mk8RpWjRQ&client_id=HGIOgho9HIRhgoepdIOPFdIUWgewi0jw');
    deepStrictEqual(await authorizeResponse.json(), IDENTITY_RESPONSE);
});
