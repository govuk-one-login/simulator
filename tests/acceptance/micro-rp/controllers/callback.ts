import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { decodeJwt, importPKCS8, SignJWT } from "jose";
import { STYLE_SHEET } from "../public/style";

export const callbackController = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.query.code) {
    res.status(400).send(
      ` 
    <head>
        <title>Callback error</title>
    </head>
    <body> 
        <h1>No auth code in callback request</h1>
        <h2> Error: ${req.query.error}, description: ${req.query.error_description}</h2>
    </body>`
    );
  }
  const privateKey = process.env.RP_PRIVATE_KEY!;
  let baseUri = `https://oidc.${process.env.ENVIRONMENT}.account.gov.uk/`;

  if (req.cookies["idp"] == "SIM") {
    baseUri = "http://localhost:3000/";
  }

  const claims = {
    aud: baseUri + "token",
    iss: process.env.RP_CLIENT_ID,
    sub: process.env.RP_CLIENT_ID,
    exp: Date.now() / 1000 + 5 * 60,
    iat: Date.now() / 1000,
    jti: randomUUID(),
  };

  const tokenSigningKey = await importPKCS8(privateKey, "RSA");
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({
      alg: "RS256",
    })
    .sign(tokenSigningKey);
  const body = {
    code: req.query["code"] as string,
    redirect_uri: "http://localhost:3001/callback",
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: jwt,
    grant_type: "authorization_code",
  };

  const tokenRes = await fetch(baseUri + "token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(
      `Token response failed with status: ${tokenRes.status}. Message: ${await tokenRes.text()}`
    );
  }

  const tokenResponse = await tokenRes.json();
  const decodedIdToken = decodeJwt(tokenResponse["id_token"]);

  const userinfoRes = await fetch(baseUri + "userinfo", {
    headers: { Authorization: `Bearer ${tokenResponse["access_token"]}` },
  });

  if (!userinfoRes.ok) {
    throw new Error(
      `Userinfo response failed with status: ${userinfoRes.status}. Authenticate Header: ${tokenRes.headers.get("WWW-Authenticate")}`
    );
  }

  //We need the text representation because weird
  // JSON string escaping
  const userInfoText = await userinfoRes.text();
  const userInfoJSON = JSON.parse(userInfoText);

  res.cookie("idToken", tokenResponse["id_token"], {
    maxAge: 3600,
  });

  res.send(`<!DOCTYPE html>
  <html lang="en" class="govuk-template ">
  <head>
      <title>Example - GOV.UK - User Info</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <meta name="theme-color" content="#0b0c0c">
  
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
  
      <link rel="shortcut icon" sizes="16x16 32x32 48x48" href="/gds/assets/images/favicon.ico" type="image/x-icon">
      <link rel="mask-icon" href="/gds/assets/images/govuk-mask-icon.svg" color="#0b0c0c">
      <link rel="apple-touch-icon" sizes="180x180" href="/gds/assets/images/govuk-apple-touch-icon-180x180.png">
      <link rel="apple-touch-icon" sizes="167x167" href="/gds/assets/images/govuk-apple-touch-icon-167x167.png">
      <link rel="apple-touch-icon" sizes="152x152" href="/gds/assets/images/govuk-apple-touch-icon-152x152.png">
      <link rel="apple-touch-icon" href="/gds/assets/images/govuk-apple-touch-icon.png">

      <style>
      ${STYLE_SHEET}
      </style>
  </head>
  <body class="govuk-template__body ">
  <a href="#main-content" class="govuk-skip-link">Skip to main content</a>
  
  <header class="govuk-header " role="banner" data-module="govuk-header">
      <div class="govuk-header__container govuk-width-container">
          <div class="govuk-header__logo">
              <a href="/" class="govuk-header__link govuk-header__link--homepage">
            <span class="govuk-header__logotype">
              <svg aria-hidden="true" focusable="false" class="govuk-header__logotype-crown"
                   xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 97" height="30" width="36">
                <path fill="currentColor" fill-rule="evenodd"
                      d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9zM4.4 57.2c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.5-1.5-7.6.3-9.1 3.8-1.4 3.5.3 7.6 3.9 9.1zm38.3-21.4c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.6-1.5-7.6.3-9.1 3.8-1.3 3.6.4 7.7 3.9 9.1zm64.4-5.6c-3.6 1.5-7.8-.2-9.1-3.7-1.5-3.6.2-7.8 3.8-9.2 3.6-1.4 7.7.3 9.2 3.9 1.3 3.5-.4 7.5-3.9 9zm15.9 9.3c-3.6 1.5-7.7-.2-9.1-3.7-1.5-3.6.2-7.8 3.7-9.1 3.6-1.5 7.7.2 9.2 3.8 1.5 3.5-.3 7.5-3.8 9zm4.7 17.7c-3.6 1.5-7.8-.2-9.2-3.8-1.5-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.3 3.5-.4 7.6-3.9 9.1zM89.3 35.8c-3.6 1.5-7.8-.2-9.2-3.8-1.4-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.4 3.6-.3 7.7-3.9 9.1zM69.7 17.7l8.9 4.7V9.3l-8.9 2.8c-.2-.3-.5-.6-.9-.9L72.4 0H59.6l3.5 11.2c-.3.3-.6.5-.9.9l-8.8-2.8v13.1l8.8-4.7c.3.3.6.7.9.9l-5 15.4v.1c-.2.8-.4 1.6-.4 2.4 0 4.1 3.1 7.5 7 8.1h.2c.3 0 .7.1 1 .1.4 0 .7 0 1-.1h.2c4-.6 7.1-4.1 7.1-8.1 0-.8-.1-1.7-.4-2.4V34l-5.1-15.4c.4-.2.7-.6 1-.9zM66 92.8c16.9 0 32.8 1.1 47.1 3.2 4-16.9 8.9-26.7 14-33.5l-9.6-3.4c1 4.9 1.1 7.2 0 10.2-1.5-1.4-3-4.3-4.2-8.7L108.6 76c2.8-2 5-3.2 7.5-3.3-4.4 9.4-10 11.9-13.6 11.2-4.3-.8-6.3-4.6-5.6-7.9 1-4.7 5.7-5.9 8-.5 4.3-8.7-3-11.4-7.6-8.8 7.1-7.2 7.9-13.5 2.1-21.1-8 6.1-8.1 12.3-4.5 20.8-4.7-5.4-12.1-2.5-9.5 6.2 3.4-5.2 7.9-2 7.2 3.1-.6 4.3-6.4 7.8-13.5 7.2-10.3-.9-10.9-8-11.2-13.8 2.5-.5 7.1 1.8 11 7.3L80.2 60c-4.1 4.4-8 5.3-12.3 5.4 1.4-4.4 8-11.6 8-11.6H55.5s6.4 7.2 7.9 11.6c-4.2-.1-8-1-12.3-5.4l1.4 16.4c3.9-5.5 8.5-7.7 10.9-7.3-.3 5.8-.9 12.8-11.1 13.8-7.2.6-12.9-2.9-13.5-7.2-.7-5 3.8-8.3 7.1-3.1 2.7-8.7-4.6-11.6-9.4-6.2 3.7-8.5 3.6-14.7-4.6-20.8-5.8 7.6-5 13.9 2.2 21.1-4.7-2.6-11.9.1-7.7 8.8 2.3-5.5 7.1-4.2 8.1.5.7 3.3-1.3 7.1-5.7 7.9-3.5.7-9-1.8-13.5-11.2 2.5.1 4.7 1.3 7.5 3.3l-4.7-15.4c-1.2 4.4-2.7 7.2-4.3 8.7-1.1-3-.9-5.3 0-10.2l-9.5 3.4c5 6.9 9.9 16.7 14 33.5 14.8-2.1 30.8-3.2 47.7-3.2z"></path>
                <image src="/assets/images/govuk-logotype-crown.png" xlink:href="data:," display="none"
                       class="govuk-header__logotype-crown-fallback-image" width="36" height="32"></image>
              </svg>
              <span class="govuk-header__logotype-text">
                GOV.UK
              </span>
            </span>
              </a>
          </div>

  </header>
  
  <div class="govuk-width-container ">
      <main class="govuk-main-wrapper govuk-main-wrapper--auto-spacing" id="main-content" role="main">
          <div class="govuk-!-margin-bottom-9">
              <h1 class="govuk-heading-l">
                  User information
              </h1>
          </div>
          <div class="govuk-grid-row">
              <div class="govuk-grid-column-full">
                  <dl class="govuk-summary-list">
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Email
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-email">
                              ${userInfoJSON.email}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Phone number
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-phone-number">
                              ${userInfoJSON.phone_number}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Journey ID
                          </dt>
                          <dd class="govuk-summary-list__value" id="journey-id">
                              ${decodedIdToken.sid}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Core Identity Claim Present
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-core-identity-claim-present">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/coreIdentityJWT"] !== undefined}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Core Identity Claim
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-core-identity-claim">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/coreIdentityJWT"] ?? ""}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Address Claim Present
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-address-claim-present">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/address"] !== undefined}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Passport Claim Present
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-passport-claim-present">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/passport"] !== undefined}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Driving Permit Claim Present
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-driving-permit-claim-present">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/drivingPermit"] !== undefined}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Return Code Claim Present
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-return-code-claim-present">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/returnCode"] !== undefined}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Return Code Claim
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-return-code-claim">
                              ${userInfoJSON["https://vocab.account.gov.uk/v1/returnCode"] ?? []}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              ID Token
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-id-token">
                              ${tokenResponse["id_token"]}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              Access Token
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-access-token">
                              ${tokenResponse["access_token"]}
                          </dd>
                      </div>
                      <div class="govuk-summary-list__row">
                          <dt class="govuk-summary-list__key">
                              User Info response
                          </dt>
                          <dd class="govuk-summary-list__value" id="user-info-response">${userInfoText}</dd>
                      </div>
                  </dl>
              </div>
              <form action="/logout" method="post">
                  <button class="govuk-button" type="submit" name="logout">Log out</button>
              </form>
          </div>
      </main>
  </div>
  
  <footer class="govuk-footer " role="contentinfo">
      <div class="govuk-width-container ">
          <div class="govuk-footer__meta">
              <div class="govuk-footer__meta-item govuk-footer__meta-item--grow">
  
                  <svg aria-hidden="true" focusable="false" class="govuk-footer__licence-logo"
                       xmlns="http://www.w3.org/2000/svg" viewBox="0 0 483.2 195.7" height="17" width="41">
                      <path fill="currentColor"
                            d="M421.5 142.8V.1l-50.7 32.3v161.1h112.4v-50.7zm-122.3-9.6A47.12 47.12 0 0 1 221 97.8c0-26 21.1-47.1 47.1-47.1 16.7 0 31.4 8.7 39.7 21.8l42.7-27.2A97.63 97.63 0 0 0 268.1 0c-36.5 0-68.3 20.1-85.1 49.7A98 98 0 0 0 97.8 0C43.9 0 0 43.9 0 97.8s43.9 97.8 97.8 97.8c36.5 0 68.3-20.1 85.1-49.7a97.76 97.76 0 0 0 149.6 25.4l19.4 22.2h3v-87.8h-80l24.3 27.5zM97.8 145c-26 0-47.1-21.1-47.1-47.1s21.1-47.1 47.1-47.1 47.2 21 47.2 47S123.8 145 97.8 145"/>
                  </svg>
                  <span class="govuk-footer__licence-description">
              All content is available under the
              <a class="govuk-footer__link"
                 href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="license">Open Government Licence v3.0</a>, except where otherwise stated
            </span>
              </div>
              <div class="govuk-footer__meta-item">
                  <a class="govuk-footer__link govuk-footer__copyright-logo"
                     href="https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/">©
                      Crown copyright</a>
              </div>
          </div>
      </div>
  </footer>
  </body>
  </html>
  `);
};
