import { ErrorOut, errors, KoaContextWithOIDC } from "oidc-provider";
import { logger } from "../logger.js";

export const errorRender = (
  ctx: KoaContextWithOIDC,
  out: ErrorOut,
  error: errors.OIDCProviderError | Error
): void => {
  if (error instanceof errors.OIDCProviderError) {
    logger.error(
      `OIDC-ProviderError: ${error.error}: Description '${error.error_description}',  Detail: '${error.error_detail ?? ""}'`
    );
  } else logger.error(`Unknown Error occurred: ${error.message}`);
};
