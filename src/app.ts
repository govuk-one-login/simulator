import express, { Application, Express, Request, Response } from "express";
import { configController } from "./components/config/config-controller.js";
import bodyParser from "body-parser";
import { createOidcProvider } from "./provider.js";
import { interactionController } from "./components/interaction/interaction-controller.js";

const createApp = async (): Promise<Application> => {
  const app: Express = express();
  const oidcProvider = await createOidcProvider();

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  app.post("/config", configController);
  app.get("/interaction/:uid", interactionController(oidcProvider));

  app.use(oidcProvider.callback());

  return app;
};

export { createApp };
