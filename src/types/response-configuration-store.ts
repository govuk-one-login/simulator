import ResponseConfiguration from "./response-configuration";

export type ResponseConfigurationStore = {
  [accessToken: string]: ResponseConfiguration;
};
