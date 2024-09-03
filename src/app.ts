import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller";
import bodyParser from "body-parser";
import { tokenController } from "./components/token/token-controller";
import { dedupeQueryParams } from "./middleware/dedupe-query-params";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(dedupeQueryParams);

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  app.post("/config", configController);
  app.post("/token", tokenController);

  return app;
};

export { createApp };
