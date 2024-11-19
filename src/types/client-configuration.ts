import { body, ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import {
  VALID_CLAIMS,
  VALID_LOC_VALUES,
  VALID_SCOPES,
  VALID_TOKEN_SIGNING_ALGORITHMS,
} from "../constants";
import { UserIdentityClaim } from "./user-info";
import { bodyOptional } from "./util/body-helpers";

export default interface ClientConfiguration {
  clientId?: string;
  publicKey?: string;
  scopes?: string[];
  redirectUrls?: string[];
  claims?: UserIdentityClaim[];
  identityVerificationSupported?: boolean;
  idTokenSigningAlgorithm?: string;
  clientLoCs?: string[];
  postLogoutRedirectUrls?: string[];
}

export const generateClientConfigurationPropertyValidators = (
  parent?: string
): ValidationChain[] => {
  const prefix = parent ? `${parent}.` : "";
  return [
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("clientId")}`
    ).isString(),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("publicKey")}`
    ).isString(),
    body(`${prefix}${nameof<ClientConfiguration>("scopes")}.*`).isIn(
      VALID_SCOPES
    ),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("redirectUrls")}.*`
    ).isURL(),
    bodyOptional(`${prefix}${nameof<ClientConfiguration>("claims")}.*`).isIn(
      VALID_CLAIMS
    ),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("identityVerificationSupported")}`
    ).isBoolean({ strict: true }),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("idTokenSigningAlgorithm")}`
    ).isIn(VALID_TOKEN_SIGNING_ALGORITHMS),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("clientLoCs")}`
    ).isArray({ min: 1 }),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("clientLoCs")}.*`
    ).isIn(VALID_LOC_VALUES),
    bodyOptional(
      `${prefix}${nameof<ClientConfiguration>("postLogoutRedirectUrls")}.*`
    ).isURL(),
  ];
};
