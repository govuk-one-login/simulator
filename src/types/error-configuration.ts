import { AuthoriseError } from "./authorise-errors.js";
import { CoreIdentityError } from "./core-identity-error.js";
import { IdTokenError } from "./id-token-error.js";
import { ValidationChain } from "express-validator";
import { nameof } from "./util/nameof.js";
import {
  AUTHORISE_ERRORS,
  CORE_IDENTITY_ERRORS,
  ID_TOKEN_ERRORS,
} from "../constants.js";
import { bodyOptional } from "./util/body-helpers.js";

export type ErrorConfiguration = {
  coreIdentityErrors?: CoreIdentityError[];
  idTokenErrors?: IdTokenError[];
  authoriseErrors?: AuthoriseError[];
};

export const generateErrorConfigPropertyValidators = (
  parent?: string
): ValidationChain[] => {
  const prefix = parent ? `${parent}.` : "";
  return [
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("coreIdentityErrors")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("coreIdentityErrors")}.*`
    ).isIn(CORE_IDENTITY_ERRORS),
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("idTokenErrors")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("idTokenErrors")}.*`
    ).isIn(ID_TOKEN_ERRORS),
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("authoriseErrors")}`
    ).isArray(),
    bodyOptional(
      `${prefix}${nameof<ErrorConfiguration>("authoriseErrors")}.*`
    ).isIn(AUTHORISE_ERRORS),
  ];
};
