import ClientConfiguration, {
  generateClientConfigurationPropertyValidators,
} from "./client-configuration.js";
import ResponseConfiguration, {
  generateResponseConfigurationPropertyValidators,
} from "./response-configuration.js";
import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof.js";
import {
  ErrorConfiguration,
  generateErrorConfigPropertyValidators,
} from "./error-configuration.js";
import { bodyOptional } from "./util/body-helpers.js";

export default interface ConfigRequest {
  simulatorUrl?: string;
  clientConfiguration?: ClientConfiguration;
  responseConfiguration?: ResponseConfiguration;
  errorConfiguration?: ErrorConfiguration;
  publishNewIdTokenSigningKeys?: boolean;
  useNewIdTokenSigningKeys?: boolean;
}

export const generateConfigRequestPropertyValidators = (
  prefix: string = ""
): ValidationChain[] => {
  return [
    bodyOptional(`${prefix}${nameof<ConfigRequest>("simulatorUrl")}`).isURL(),
    bodyOptional(
      `${prefix}${nameof<ConfigRequest>("clientConfiguration")}`
    ).isObject(),
    ...generateClientConfigurationPropertyValidators(
      `${prefix}${nameof<ConfigRequest>("clientConfiguration")}.`
    ),
    bodyOptional(
      `${prefix}${nameof<ConfigRequest>("responseConfiguration")}`
    ).isObject(),
    ...generateResponseConfigurationPropertyValidators(
      `${prefix}${nameof<ConfigRequest>("responseConfiguration")}.`
    ),
    bodyOptional(
      `${prefix}${nameof<ConfigRequest>("errorConfiguration")}`
    ).isObject(),
    ...generateErrorConfigPropertyValidators(
      `${prefix}${nameof<ConfigRequest>("errorConfiguration")}.`
    ),
    bodyOptional(
      `${prefix}${nameof<ConfigRequest>("publishNewIdTokenSigningKeys")}`
    ).isBoolean(),
    bodyOptional(
      `${prefix}${nameof<ConfigRequest>("useNewIdTokenSigningKeys")}`
    ).isBoolean(),
  ];
};
