import { Request, Response } from "express";
import { generateJWKS } from "../token/helper/key-helpers";

export const jwksController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.header("Content-Type", "application/json");
  res.header("Cache-Control", "max-age=86400");
  res.contentType("application/json");
  res.send(JSON.stringify(await generateJWKS()));
};
