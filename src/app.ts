import express, { Application, Express, Request, Response } from "express";
import bodyParser from "body-parser";

const createApp = (): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  return app;
};

export { createApp };
