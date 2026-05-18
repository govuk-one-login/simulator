import ResponseConfiguration from "./response-configuration.js";

export type ResponseConfigurationStore = {
  [accessToken: string]: ResponseConfiguration;
};
