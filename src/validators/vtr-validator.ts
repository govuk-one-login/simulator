import { Config } from "../config";
import { AuthoriseRequestError } from "../errors/authorise-request-error";
import { logger } from "../logger";
import { VALID_CREDENTIAL_TRUST_VALUES, VALID_LOC_VALUES } from "../constants";
import { VectorOfTrust } from "../types/vector-of-trust";

export const DEFAULT_VTR: VectorOfTrust[] = [
  {
    levelOfConfidence: null,
    credentialTrust: "Cl.Cm",
  },
];

export const vtrValidator = (
  vtr: string | undefined,
  config: Config,
  state: string,
  redirectUri: string
): VectorOfTrust[] => {
  if (!vtr) {
    logger.info("No vtr value provided, attaching default credential trust");
    return DEFAULT_VTR;
  }

  let vtrSet: string[];
  let parsedVtrSet: VectorOfTrust[];

  try {
    vtrSet = JSON.parse(vtr);
    parsedVtrSet = vtrSet.map(parseSingleVtr);
  } catch (error) {
    logger.error("Error parsing vtr value: " + (error as Error).message);
    throw generateInvalidVtrError(redirectUri, state);
  }

  if (vtrSet.length == 0) {
    logger.info("No vtr value provided, attaching default credential trust");
    return DEFAULT_VTR;
  }

  const clientLevelsOfConfidence = config.getClientLoCs();

  const identityVectors = parsedVtrSet
    .map((vector) => vector.levelOfConfidence)
    .filter(
      (levelOfConfidence) =>
        levelOfConfidence !== null && levelOfConfidence !== "P0"
    );

  if (
    identityVectors.length !== 0 &&
    identityVectors.length < parsedVtrSet.length
  ) {
    logger.error("VTR cannot contain both identity and non-identity vectors");
    throw generateInvalidVtrError(redirectUri, state);
  }

  if (!identityVectors.every((loc) => clientLevelsOfConfidence.includes(loc))) {
    logger.error(
      "Level of confidence values have been requested which this client is not permitted to request. Level of confidence values in request: " +
        identityVectors.join(" ")
    );
    throw generateInvalidVtrError(redirectUri, state);
  }

  return parsedVtrSet;
};

const parseSingleVtr = (singleVtr: string): VectorOfTrust => {
  const splitVtrValues = singleVtr.split(".");

  const credentialTrustValue = splitVtrValues
    .filter(isCredentialTrust)
    .sort()
    .join(".") as "Cl" | "Cl.Cm";

  const providedLevelsOfConfidence = splitVtrValues.filter(isVectorOfTrust);
  const unknownValues = splitVtrValues.filter(isUnknown);

  if (
    !providedLevelsOfConfidence.every((loc) => VALID_LOC_VALUES.includes(loc))
  ) {
    throw new Error("Invalid LevelOfConfidence provided");
  }

  if (providedLevelsOfConfidence.length > 1) {
    throw new Error(
      "VTR must contain either 0 or 1 identity proofing components"
    );
  }

  if (unknownValues.length !== 0) {
    logger.warn(
      `Unknown values in VTR, these will be ignored: ${unknownValues}`
    );
  }

  if (!VALID_CREDENTIAL_TRUST_VALUES.includes(credentialTrustValue)) {
    throw new Error("Invalid Credential Trust Value provided");
  }

  const parsedVtr: VectorOfTrust = {
    credentialTrust: credentialTrustValue,
    levelOfConfidence: providedLevelsOfConfidence[0] ?? null,
  };

  const credentialTrustIsNotMedium = parsedVtr.credentialTrust !== "Cl.Cm";
  const identityBeenRequested =
    parsedVtr.levelOfConfidence === "P1" ||
    parsedVtr.levelOfConfidence === "P2";

  if (identityBeenRequested && credentialTrustIsNotMedium) {
    throw new Error(
      "Non zero identity confidence must require at least Cl.Cm credential trust"
    );
  }

  return parsedVtr;
};

const isCredentialTrust = (
  credentialTrust: string
): credentialTrust is "Cl" | "Cm" => credentialTrust.startsWith("C");

const isVectorOfTrust = (
  levelOfConfidence: string
): levelOfConfidence is "P0" | "P1" | "P2" => levelOfConfidence.startsWith("P");

const isUnknown = (vtr: string): boolean =>
  !isCredentialTrust(vtr) && !isVectorOfTrust(vtr);

const generateInvalidVtrError = (
  redirectUri: string,
  state: string
): AuthoriseRequestError =>
  new AuthoriseRequestError({
    errorCode: "invalid_request",
    errorDescription: "Request vtr not valid",
    httpStatusCode: 302,
    state,
    redirectUri,
  });
