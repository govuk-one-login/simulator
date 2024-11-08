import ConfigRequest from "../../types/config-request";
import { Request, Response } from "express";
import { Config } from "../../config";
import ClientConfiguration from "../../types/client-configuration";
import ResponseConfiguration from "../../types/response-configuration";
import { ErrorConfiguration } from "../../types/error-configuration";
import { isCoreIdentityError } from "../../validators/core-identity-error";
import { isIdTokenError } from "../../validators/id-token-error";
import { isAuthoriseError } from "../../validators/authorise-errors";
import { validationResult } from "express-validator";

export const configController = (
  req: Request<ConfigRequest>,
  res: Response
): void => {
  const validationFailures = validationResult(req);
  if (!validationFailures.isEmpty()) {
    res.status(400).send({ errors: validationFailures.mapped() });
    return;
  }

  if (req.body.clientConfiguration !== undefined) {
    populateClientConfiguration(req.body.clientConfiguration);
  }
  if (req.body.responseConfiguration !== undefined) {
    populateResponseConfiguration(req.body.responseConfiguration);
  }
  if (req.body.simulatorUrl !== undefined) {
    Config.getInstance().setSimulatorUrl(req.body.simulatorUrl);
  }

  populateErrorConfiguration(req.body.errorConfiguration);

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
  if (clientConfiguration.postLogoutRedirectUrls !== undefined) {
    config.setPostLogoutRedirectUrls(
      clientConfiguration.postLogoutRedirectUrls
    );
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
  if (responseConfiguration.maxLoCAchieved !== undefined) {
    config.setMaxLoCAchieved(responseConfiguration.maxLoCAchieved);
  }
  if (responseConfiguration.coreIdentityVerifiableCredentials !== undefined) {
    config.setVerifiableIdentityCredentials(
      responseConfiguration.coreIdentityVerifiableCredentials
    );
  }
  if (responseConfiguration.passportDetails !== undefined) {
    config.setPassportDetails(responseConfiguration.passportDetails);
  }
  if (responseConfiguration.drivingPermitDetails !== undefined) {
    config.setDrivingPermitDetails(responseConfiguration.drivingPermitDetails);
  }
  if (responseConfiguration.socialSecurityRecordDetails !== undefined) {
    config.setSocialSecurityRecordDetails(
      responseConfiguration.socialSecurityRecordDetails
    );
  }
  if (responseConfiguration.postalAddressDetails !== undefined) {
    config.setPostalAddressDetails(responseConfiguration.postalAddressDetails);
  }
  if (responseConfiguration.returnCodes !== undefined) {
    config.setReturnCodes(responseConfiguration.returnCodes);
  }
};

const populateErrorConfiguration = (
  errorConfiguration: Partial<ErrorConfiguration> | undefined
): void => {
  const config = Config.getInstance();

  if (!errorConfiguration) {
    config.setCoreIdentityErrors([]);
    config.setIdTokenErrors([]);
    config.setAuthoriseErrors([]);
    return;
  }

  const coreIdentityErrors =
    errorConfiguration.coreIdentityErrors?.filter(isCoreIdentityError) ?? [];

  const idTokenErrors =
    errorConfiguration.idTokenErrors?.filter(isIdTokenError) ?? [];

  const authoriseErrors =
    errorConfiguration.authoriseErrors?.filter(isAuthoriseError) ?? [];

  config.setCoreIdentityErrors(coreIdentityErrors);
  config.setIdTokenErrors(idTokenErrors);
  config.setAuthoriseErrors(authoriseErrors);
};
