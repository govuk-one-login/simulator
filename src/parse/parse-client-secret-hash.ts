import { Options } from "argon2";

export const parseClientSecretHashIntoParams = (
  encodedHash: string
): { hash: Buffer; options: Options } => {
  const params: Partial<Options> = {};

  const parts = encodedHash.split("$");
  if (parts.length < 4) {
    throw new Error("Invalid client secret hash");
  }
  let currentPart = 2;

  if (parts[currentPart].startsWith("v=")) {
    params.version = Number.parseInt(parts[currentPart].substring(2));
    currentPart++;
  }

  const performanceParams = parts[currentPart++].split(",");

  if (performanceParams.length !== 3) {
    throw new Error("Invalid performance params");
  }

  if (!performanceParams[0].startsWith("m=")) {
    throw new Error("Invalid memory param");
  }
  params["memoryCost"] = Number.parseInt(performanceParams[0].substring(2));

  if (!performanceParams[1].startsWith("t=")) {
    throw new Error("Invalid time cost param");
  }

  params["timeCost"] = Number.parseInt(performanceParams[1].substring(2));

  if (!performanceParams[2].startsWith("p=")) {
    throw new Error("Invalid parallelity param");
  }

  params["parallelism"] = Number.parseInt(performanceParams[2].substring(2));

  params["salt"] = Buffer.from(parts[currentPart++], "base64");
  const hash = Buffer.from(parts[currentPart], "base64");
  params.hashLength = hash.length;
  return {
    hash,
    options: params,
  };
};
