import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import bodyParser from "body-parser";
import { tokenController } from "./components/token/token-controller";
import { authoriseGetController } from "./components/authorise/authorise-get-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";
import { userInfoController } from "./components/user-info/user-info-controller";
import morgan from "morgan";
import { generateJWKS } from "./components/token/helper/key-helpers";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(morgan("tiny"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(dedupeQueryParams);

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });
  app.get("/authorize", authoriseGetController);

  app.post("/config", configController);
  app.post("/token", tokenController);
  app.get("/userinfo", userInfoController);
  app.get("/.well-known/openid-configuration", (_req, res) => {
    res.header("Content-Type", "application/json");
    res.send(
      '{"authorization_endpoint":"http://host.docker.internal:3000/authorize","token_endpoint":"http://host.docker.internal:3000/token","registration_endpoint":"http://host.docker.internal:3000/connect/register","issuer":"http://host.docker.internal:3000/","jwks_uri":"http://host.docker.internal:3000/.well-known/jwks.json","scopes_supported":["openid","email","phone","offline_access"],"response_types_supported":["code"],"grant_types_supported":["authorization_code"],"token_endpoint_auth_methods_supported":["private_key_jwt","client_secret_post"],"token_endpoint_auth_signing_alg_values_supported":["RS256","RS384","RS512","PS256","PS384","PS512"],"ui_locales_supported":["en","cy"],"service_documentation":"https://docs.sign-in.service.gov.uk/","op_policy_uri":"https://signin.account.gov.uk/privacy-notice","op_tos_uri":"https://signin.account.gov.uk/terms-and-conditions","request_parameter_supported":true,"trustmarks":"http://host.docker.internal:3000/trustmark","subject_types_supported":["public","pairwise"],"userinfo_endpoint":"http://host.docker.internal:3000/userinfo","end_session_endpoint":"http://host.docker.internal:3000/logout","id_token_signing_alg_values_supported":["ES256","RS256"],"claim_types_supported":["normal"],"claims_supported":["sub","email","email_verified","phone_number","phone_number_verified","wallet_subject_id","https://vocab.account.gov.uk/v1/passport","https://vocab.account.gov.uk/v1/socialSecurityRecord","https://vocab.account.gov.uk/v1/drivingPermit","https://vocab.account.gov.uk/v1/coreIdentityJWT","https://vocab.account.gov.uk/v1/address","https://vocab.account.gov.uk/v1/inheritedIdentityJWT","https://vocab.account.gov.uk/v1/returnCode"],"request_uri_parameter_supported":false,"backchannel_logout_supported":true,"backchannel_logout_session_supported":false}'
    );
  });
  app.get("/.well-known/jwks.json", async (req: Request, res: Response) => {
    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(await generateJWKS()));
  });

  return app;
};

export { createApp };
