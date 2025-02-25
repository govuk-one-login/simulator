import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import { tokenController } from "./components/token/token-controller";
import { authoriseController } from "./components/authorise/authorise-get-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";
import { userInfoController } from "./components/user-info/user-info-controller";
import { generateJWKS } from "./components/token/helper/key-helpers";
import { openidConfigurationController } from "./components/openid-configuration/openid-configuration-controller";
import { trustmarkController } from "./components/trustmark/trustmark-controller";
import { generateConfigRequestPropertyValidators } from "./types/config-request";
import { body, checkExact } from "express-validator";
import { didController } from "./components/did/did-controller";
import { logoutController } from "./components/logout/logout-controller";
import { getConfigController } from "./components/config/get-config-controller";
import { formSubmitController } from "./components/form-submit/form-submit-controller";
import { generateConfigFormFieldValidator } from "./types/response-configuration";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(dedupeQueryParams);

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
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
  app.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(await generateJWKS()));
  });
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
