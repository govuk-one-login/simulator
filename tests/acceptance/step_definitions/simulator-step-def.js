const { When } = require("@cucumber/cucumber");
const { AUTH_ONLY_REQUEST } = require("../data/auth-only");
const { IDENTITY_REQUEST } = require("../data/identity");

When("the simulator is sent the configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
            "responseConfiguration": AUTH_ONLY_REQUEST, 
            clientConfiguration: {
                clientId: process.env.RP_CLIENT_ID,
                publicKey: process.env.RP_PUBLIC_KEY,
                postLogoutRedirectUrls: ["http://localhost:3001/signed-out"] 
            }
        }),
    };
    const response = await fetch('http://localhost:3000/config', configRequestOptions);

    if(!response.ok){
        throw new Error(
            "Failed to configure simulator configuration, request failed with status code: " + response.status
            )
    }
})

When("the simulator is sent the identity configuration", async function () {
    const configRequestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        "responseConfiguration": IDENTITY_REQUEST, 
            clientConfiguration: {
                clientId: process.env.RP_CLIENT_ID,
                publicKey: process.env.RP_PUBLIC_KEY, 
                postLogoutRedirectUrls: ["http://localhost:3001/signed-out"] 
            }
        }),
    };
    const response = await fetch('http://localhost:3000/config', configRequestOptions);

    if(!response.ok){
        throw new Error(
            "Failed to configure simulator configuration, request failed with status code: " + response.status
            )
    }
})