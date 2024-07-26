import ClientConfiguration from "./client-configuration";
import ResponseConfiguration from "./response-configuration";

export default interface ConfigRequest {
  clientConfiguration: ClientConfiguration;
  responseConfiguration: ResponseConfiguration;
}
