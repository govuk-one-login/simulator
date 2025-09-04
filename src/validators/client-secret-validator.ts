import { logger } from "../logger";
import { parseClientSecretHashIntoParams } from "../parse/parse-client-secret-hash";
import { argon2id, hash, Options } from "argon2";

export const isClientSecretValid = async (
  rawClientSecret: string,
  encodedHash: string
): Promise<boolean> => {
  let parsedHash: { hash: Buffer; options: Options };
  try {
    parsedHash = parseClientSecretHashIntoParams(encodedHash);
  } catch (error) {
    logger.warn(
      "Failed to parse client secret hash: " + (error as Error).message
    );
    return false;
  }

  const hashByteArray = new Uint8Array(parsedHash.hash);
  const hashedSecret = await hash(Buffer.from(rawClientSecret), {
    ...parsedHash.options,
    type: argon2id,
    raw: true, //Flag required to return the raw hash value not encoded hash
  });

  return constantTimeArrayEquals(hashByteArray, new Uint8Array(hashedSecret));
};

const constantTimeArrayEquals = (
  expected: Uint8Array,
  actual: Uint8Array
): boolean => {
  if (expected.length != actual.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected[i] ^ actual[i];
  }
  return result === 0;
};
