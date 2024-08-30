import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import bodyParser from "body-parser";
import { tokenController } from "./components/token/token-controller";
import { authoriseGetController } from "./components/authorise/authorise-get-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";
import { userInfoController } from "./components/user-info/user-info-controller";

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

  return app;
};

export { createApp };
