import { Request, Response } from "express";
import { Config } from "../../config";

export const trustmarkController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const config = Config.getInstance();

  res.header("Content-Type", "application/json");
  res.send(
    `{"idp":"${config.getSimulatorUrl()}/","trustmark_provider":"${config.getSimulatorUrl()}/","C":["Cl","Cl.Cm"],"P":["P0","P1","P2"]}`
  );
};
