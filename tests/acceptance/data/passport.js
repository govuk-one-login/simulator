import { tryParseJSON } from "./../util/try-parse-json.js";

export const PASSPORT = [tryParseJSON(process.env.TEST_USER_PASSPORT ?? "{}")];
