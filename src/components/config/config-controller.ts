import ConfigRequest from "../../types/config-request";
import { Request, Response } from "express";
import { Config } from "../../config";
import ClientConfiguration from "../../types/client-configuration";
import ResponseConfiguration from "../../types/response-configuration";

export const configController = (
  req: Request<ConfigRequest>,
  res: Response
): void => {
  if (req.body.clientConfiguration !== undefined) {
    populateClientConfiguration(req.body.clientConfiguration);
  }
  if (req.body.responseConfiguration !== undefined) {
    populateResponseConfiguration(req.body.responseConfiguration);
  }

  res.status(200).send();
};

const populateClientConfiguration = (
  clientConfiguration: ClientConfiguration
) => {
  const config = Config.getInstance();

  if (clientConfiguration.clientId !== undefined) {
    config.setClientId(clientConfiguration.clientId);
  }
  if (clientConfiguration.publicKey !== undefined) {
    config.setPublicKey(clientConfiguration.publicKey);
  }
  if (clientConfiguration.scopes !== undefined) {
    config.setScopes(clientConfiguration.scopes);
  }
  if (clientConfiguration.redirectUrls !== undefined) {
    config.setRedirectUrls(clientConfiguration.redirectUrls);
  }
  if (clientConfiguration.claims !== undefined) {
    config.setClaims(clientConfiguration.claims);
  }
  if (clientConfiguration.identityVerificationSupported !== undefined) {
    config.setIdentityVerificationSupported(
      clientConfiguration.identityVerificationSupported
    );
  }
  if (clientConfiguration.idTokenSigningAlgorithm !== undefined) {
    config.setIdTokenSigningAlgorithm(
      clientConfiguration.idTokenSigningAlgorithm
    );
  }
  if (clientConfiguration.clientLoCs !== undefined) {
    config.setClientLoCs(clientConfiguration.clientLoCs);
  }
};

const populateResponseConfiguration = (
  responseConfiguration: ResponseConfiguration
) => {
  const config = Config.getInstance();
  if (responseConfiguration.sub !== undefined) {
    config.setSub(responseConfiguration.sub);
  }
  if (responseConfiguration.email !== undefined) {
    config.setEmail(responseConfiguration.email);
  }
  if (responseConfiguration.emailVerified !== undefined) {
    config.setEmailVerified(responseConfiguration.emailVerified);
  }
  if (responseConfiguration.phoneNumber !== undefined) {
    config.setPhoneNumber(responseConfiguration.phoneNumber);
  }
  if (responseConfiguration.phoneNumberVerified !== undefined) {
    config.setPhoneNumberVerified(responseConfiguration.phoneNumberVerified);
  }
};
