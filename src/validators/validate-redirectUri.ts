const PROHIBITED_REDIRECT_URI_SCHEMES: string[] = [
  "data",
  "javascript",
  "vbscript",
];
const PROHIBITED_REDIRECT_URI_QUERY_PARAMETER_NAMES: string[] = [
  "code",
  "state",
  "response",
];

export const ensureLegalRedirectURI = (redirectURI: URL): void => {
  const urlScheme = redirectURI.protocol.replace(":", "");

  if (PROHIBITED_REDIRECT_URI_SCHEMES.includes(urlScheme)) {
    throw new Error(`The URI scheme ${urlScheme} is prohibited`);
  }

  redirectURI.searchParams.forEach((value, key) => {
    if (PROHIBITED_REDIRECT_URI_QUERY_PARAMETER_NAMES.includes(key)) {
      throw new Error(`The query parameter ${key} is prohibited`);
    }
  });
};
