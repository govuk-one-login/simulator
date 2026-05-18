import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller.js";
import { tokenController } from "./components/token/token-controller.js";
import { authoriseController } from "./components/authorise/authorise-get-controller.js";
import { dedupeQueryParams } from "./middleware/dedupe-query-params.js";
import { userInfoController } from "./components/user-info/user-info-controller.js";
import { openidConfigurationController } from "./components/openid-configuration/openid-configuration-controller.js";
import { trustmarkController } from "./components/trustmark/trustmark-controller.js";
import { generateConfigRequestPropertyValidators } from "./types/config-request.js";
import { body, checkExact } from "express-validator";
import { didController } from "./components/did/did-controller.js";
import { logoutController } from "./components/logout/logout-controller.js";
import { getConfigController } from "./components/config/get-config-controller.js";
import { formSubmitController } from "./components/form-submit/form-submit-controller.js";
import { generateConfigFormFieldValidator } from "./types/response-configuration.js";
import { jwksController } from "./components/jwks/jwks-controller.js";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(dedupeQueryParams);

  app.get("/", (req: Request, res: Response) => {
    res.send("GOV.UK One Login Simulator");
  });
  app.use("/authorize", authoriseController);

  app.post(
    "/config",
    ...generateConfigRequestPropertyValidators(),
    checkExact(),
    // this root object check must come after checkExact or unknown fields will be ignored - appears to be a bug
    body().isObject(),
    configController
  );
  app.get("/config", getConfigController);
  app.post("/token", tokenController);
  app.get("/userinfo", userInfoController);
  app.get("/trustmark", trustmarkController);
  app.get("/.well-known/openid-configuration", openidConfigurationController);
  app.get("/.well-known/jwks.json", jwksController);
  app.get("/.well-known/did.json", didController);
  app.get("/logout", logoutController);
  app.post(
    "/form-submit",
    ...generateConfigFormFieldValidator(),
    formSubmitController
  );

  return app;
};

export { createApp };
