import Provider, { errors } from "oidc-provider";
import { Request, Response } from "express";
import { Config } from "../../config.js";

export const interactionController =
  (provider: Provider) => async (req: Request, res: Response) => {
    const accountId = Config.getInstance().getSub();
    const interactionDetails = await provider.interactionDetails(req, res);

    if (interactionDetails.prompt.name === "login") {
      return provider.interactionFinished(req, res, {
        login: { accountId },
      });
    } else
      throw new errors.UnmetAuthenticationRequirements(
        "Unmet authentication requirement"
      );
  };
