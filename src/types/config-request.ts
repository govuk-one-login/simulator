import ClientConfiguration, {
  generateClientConfigurationPropertyValidators,
} from "./client-configuration";
import ResponseConfiguration, {
  generateResponseConfigurationPropertyValidators,
} from "./response-configuration";
import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof";
import {
  ErrorConfiguration,
  generateErrorConfigPropertyValidators,
} from "./error-configuration";
import { bodyOptional } from "./util/body-helpers";

export default interface ConfigRequest {
  simulatorUrl?: string;
  clientConfiguration?: ClientConfiguration;
  responseConfiguration?: ResponseConfiguration;
  errorConfiguration?: ErrorConfiguration;
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
  ];
};
