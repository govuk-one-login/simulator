import ConfigRequest from "../../types/configRequest";
import { Request, Response } from "express";
import { Config } from "../../config";

export const configController = (
  req: Request<ConfigRequest>,
  res: Response
): void => {
  const config = Config.getInstance();
  if (req.body.clientId !== undefined) {
    config.setClientId(req.body.clientId);
  }
  if (req.body.publicKey !== undefined) {
    config.setPublicKey(req.body.publicKey);
  }
  if (req.body.scopes !== undefined) {
    config.setScopes(req.body.scopes);
  }
  if (req.body.redirectUrls !== undefined) {
    config.setRedirectUrls(req.body.redirectUrls);
  }
  if (req.body.claims !== undefined) {
    config.setClaims(req.body.claims);
  }
  if (req.body.identityVerificationSupported !== undefined) {
    config.setIdentityVerificationSupported(
      req.body.identityVerificationSupported
    );
  }
  if (req.body.idTokenSigningAlgorithm !== undefined) {
    config.setIdTokenSigningAlgorithm(req.body.idTokenSigningAlgorithm);
  }
  if (req.body.clientLoCs !== undefined) {
    config.setClientLoCs(req.body.clientLoCs);
  }
  if (req.body.sub !== undefined) {
    config.setSub(req.body.sub);
  }
  if (req.body.email !== undefined) {
    config.setEmail(req.body.email);
  }
  if (req.body.emailVerified !== undefined) {
    config.setEmailVerified(req.body.emailVerified);
  }
  if (req.body.phoneNumber !== undefined) {
    config.setPhoneNumber(req.body.phoneNumber);
  }
  if (req.body.phoneNumberVerified !== undefined) {
    config.setPhoneNumberVerified(req.body.phoneNumberVerified);
  }
  res.status(200).send();
};
