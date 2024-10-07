import { Request, Response } from "express";
import { Config } from "../../config";
import { generateDidJwks } from "../token/helper/key-helpers";
import { EC_PRIVATE_IDENTITY_SIGNING_KEY_ID } from "../../constants";

export const didController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const config = Config.getInstance();
  const body = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/jwk/v1",
    ],
    id: config.getDidController(),
    assertionMethod: [
      {
        type: "JsonWebKey",
        id: `${config.getDidController()}#${EC_PRIVATE_IDENTITY_SIGNING_KEY_ID}`,
        controller: config.getDidController(),
        publicKeyJwk: await generateDidJwks(),
      },
    ],
  };
  res.header("Content-Type", "application/json");
  res.send(body);
};
