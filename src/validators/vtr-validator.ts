import { Client, errors, KoaContextWithOIDC } from "oidc-provider";
import {
  DEFAULT_CREDENTIAL_TRUST,
  VALID_CREDENTIAL_TRUST_VALUES,
  VALID_LOC_VALUES,
} from "../constants/provider-config.js";
import { Config } from "../config.js";
import { logger } from "../logger.js";

type VectorOfTrust = {
  CredentialTrust: "Cl" | "Cl.Cm";
  LevelOfConfidence: null | "P0" | "P2";
};

export const vtrValidator = (
  ctx: KoaContextWithOIDC,
  vtr: string | undefined,
  _client: Client
): void => {
  const parsedVtrParam: string[] = parseVtrSet(vtr, ctx);
  const vectorsOfTrust: VectorOfTrust[] = parsedVtrParam.map((vtr) =>
    parseVtr(vtr)
  );

  const identityVectors = vectorsOfTrust
    .filter((vtr) => typeof vtr.LevelOfConfidence === "string")
    .map((vtr) => vtr.LevelOfConfidence) as ("P0" | "P2")[];

  if (
    identityVectors.length !== 0 &&
    identityVectors.length < vectorsOfTrust.length
  ) {
    logger.error("VTR cannot contain both identity and non-identity vectors");
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  const config = Config.getInstance();

  const clientLoCs = config.getClientLoCs();
  const clientIdVerificationSupported =
    config.getIdentityVerificationSupported();

  if (
    !identityVectors.every((identityVector) =>
      clientLoCs.includes(identityVector)
    )
  ) {
    logger.error(
      "VTR contains identity vectors not present in client configuration"
    );
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  if (identityVectors.includes("P2") && !clientIdVerificationSupported) {
    logger.error(
      "Client has included identity vectors with identity verification not supported"
    );
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  if (ctx.oidc.params) {
    ctx.oidc.params.vtr = JSON.stringify(vectorsOfTrust);
  }
  return;
};

const parseVtrSet = (
  vtr: string | undefined,
  _ctx: KoaContextWithOIDC
): string[] => {
  if (!vtr) {
    logger.info("Vtr not present, replacing with default");

    return [DEFAULT_CREDENTIAL_TRUST];
  } else
    try {
      return JSON.parse(vtr);
    } catch (_error) {
      logger.error("Error parsing VTR");
      throw new errors.InvalidRequest("Request vtr not valid");
    }
};

const parseVtr = (vtr: string): VectorOfTrust => {
  const splitVtrValues = vtr.split(".");

  const credentialTrustValue = splitVtrValues
    .filter(isCredentialTrust)
    .sort()
    .join(".");

  const levelsOfConfidence = splitVtrValues.filter(isVectorOfTrust);
  const unknownValues = splitVtrValues.filter(isUnknown);

  if (levelsOfConfidence.length > 1) {
    logger.error("VTR must contain either 0 or 1 identity proofing components");
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  if (unknownValues.length > 0) {
    logger.error("Invalid Credential trust values present in Vtr", vtr);
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  if (!VALID_CREDENTIAL_TRUST_VALUES.includes(credentialTrustValue)) {
    logger.error("Invalid CredentialTrustLevel");
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  if (
    levelsOfConfidence[0] &&
    !VALID_LOC_VALUES.includes(levelsOfConfidence[0])
  ) {
    logger.error(
      "Invalid Level of confidence value requested: ",
      levelsOfConfidence[0]
    );
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  const parsedVtr: VectorOfTrust = {
    CredentialTrust: credentialTrustValue as "Cl" | "Cl.Cm",
    LevelOfConfidence: levelsOfConfidence[0] ?? null,
  };

  if (
    parsedVtr.LevelOfConfidence === "P2" &&
    parsedVtr.CredentialTrust !== "Cl.Cm"
  ) {
    logger.error(
      "P2 identity confidence must require at least Cl.Cm credential trust"
    );
    throw new errors.InvalidRequest("Request vtr not valid");
  }

  return parsedVtr;
};

const isCredentialTrust = (credentialTrust: string) =>
  credentialTrust.startsWith("C");
const isVectorOfTrust = (
  levelOfConfidence: string
): levelOfConfidence is "P0" | "P2" => levelOfConfidence.startsWith("P");
const isUnknown = (vtr: string) =>
  !isCredentialTrust(vtr) && !isVectorOfTrust(vtr);
