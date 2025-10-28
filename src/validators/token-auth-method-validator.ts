import { logger } from "../logger";

export type TokenAuthMethod = "private_key_jwt" | "client_secret_post";

export const isValidTokenAuthMethod = (val: string): val is TokenAuthMethod => {
  if (val === "private_key_jwt" || val === "client_secret_post") {
    return true;
  }
  logger.warn(
    `Invalid token auth method provided: ${val}. Simulator will default to 'private_key_jwt'.`
  );
  return false;
};
