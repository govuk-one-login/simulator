import { tryParseJSON } from "./../util/try-parse-json.js";

export const ADDRESS = [tryParseJSON(process.env.TEST_USER_ADDRESS)];
