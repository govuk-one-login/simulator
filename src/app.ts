import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import { tokenController } from "./components/token/token-controller";
import { authoriseGetController } from "./components/authorise/authorise-get-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";
import { userInfoController } from "./components/user-info/user-info-controller";
import { generateJWKS } from "./components/token/helper/key-helpers";
import { openidConfigurationController } from "./components/openid-configuration/openid-configuration-controller";
import { trustmarkController } from "./components/trustmark/trustmark-controller";
import { generateConfigRequestPropertyValidators } from "./types/config-request";
import { body, checkExact } from "express-validator";
import { didController } from "./components/did/did-controller";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(dedupeQueryParams);

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });
  app.get("/authorize", authoriseGetController);

  app.post(
    "/config",
    ...generateConfigRequestPropertyValidators(),
    checkExact(),
    // this root object check must come after checkExact or unknown fields will be ignored - appears to be a bug
    body().isObject(),
    configController
  );
  app.post("/token", tokenController);
  app.get("/userinfo", userInfoController);
  app.get("/trustmark", trustmarkController);
  app.get("/.well-known/openid-configuration", openidConfigurationController);
  app.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(await generateJWKS()));
  });
  app.get("/.well-known/did.json", didController);

  return app;
};

export { createApp };
