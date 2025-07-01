const { tryParseJSON } = require("./../util/try-parse-json");

const PASSPORT = [tryParseJSON(process.env.TEST_USER_PASSPORT ?? "{}")];

module.exports = { PASSPORT };
