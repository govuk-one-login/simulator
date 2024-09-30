import express, { Application, Express, Request, Response } from "express";
import {
  body,
  checkExact,
  ValidationChain,
  validationResult,
} from "express-validator";
import ConfigRequest from "../config-request";

export const createTestValidationApp = (
  validators: ValidationChain[]
): Application => {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.post(
    "/test-validation",
    ...validators,
    checkExact(),
    body().isObject(),
    (req: Request<ConfigRequest>, res: Response): void => {
      const validationFailures = validationResult(req);
      if (!validationFailures.isEmpty()) {
        res.status(400).send({ errors: validationFailures.mapped() });
        return;
      }

      res.status(200).send();
    }
  );

  return app;
};
