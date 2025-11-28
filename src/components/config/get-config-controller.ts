import { Request, Response } from "express";
import { Config } from "../../config";

export const getConfigController = (req: Request, res: Response): void => {
  const config = Config.getInstance();
  const body = {
    clientConfiguration: config.getClientConfiguration(),
    errorConfiguration: config.getErrorConfiguration(),
    responseConfiguration: config.getResponseConfiguration(),
    simulatorUrl: config.getSimulatorUrl(),
    publishNewIdTokenKeysEnabled: config.isPublishNewTokenSigningKeysEnabled(),
    usingNewIdTokenSigningKeys: config.isUseNewTokenSigningKeysEnabled(),
  };
  res.header("Content-Type", "application/json");
  res.status(200);
  res.send(body);
};
