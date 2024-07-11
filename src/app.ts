import express, { Application, Express, Request, Response } from "express";

const createApp = (): Application => {
  const app: Express = express();

  app.get("/", (req: Request, res: Response) => {
    res.send("Express + TypeScript Server");
  });

  return app;
};

export { createApp };
