import ClientConfiguration from "./client-configuration.js";
import ResponseConfiguration from "./response-configuration.js";

export default interface ConfigRequest {
  clientConfiguration: ClientConfiguration;
  responseConfiguration: ResponseConfiguration;
}
