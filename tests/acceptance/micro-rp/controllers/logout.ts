import { randomUUID } from "crypto";
import { Request, Response } from "express";

export const logoutController = (req: Request, res: Response): void => {
  let baseUri = `https://oidc.${process.env.ENVIRONMENT}.account.gov.uk/`;

  if (req.cookies.idp === "SIM") {
    baseUri = "http://localhost:3000/";
  }
  const id_token = req.cookies.idToken;
  res.cookie("idp", null);
  res.cookie("idToken", null);
  res.redirect(
    baseUri +
      `logout?state=${randomUUID()}&id_token_hint=${id_token}&post_logout_redirect_uri=${encodeURIComponent("http://localhost:3001/signed-out")}`
  );
};
