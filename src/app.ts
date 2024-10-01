import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import bodyParser from "body-parser";
import { tokenController } from "./components/token/token-controller";
import { authoriseGetController } from "./components/authorise/authorise-get-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";
import { userInfoController } from "./components/user-info/user-info-controller";
import { generateJWKS } from "./components/token/helper/key-helpers";
import { openidConfigurationController } from "./components/openid-configuration/openid-configuration-controller";
import { trustmarkController } from "./components/trustmark/trustmark-controller";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
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
  app.get("/trustmark", trustmarkController);
  app.get("/.well-known/openid-configuration", openidConfigurationController);
  app.get("/.well-known/jwks.json", async (_req: Request, res: Response) => {
    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(await generateJWKS()));
  });

  return app;
};

export { createApp };
