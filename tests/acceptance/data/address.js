const { tryParseJSON } = require("./../util/try-parse-json");
const ADDRESS = [tryParseJSON(process.env.TEST_USER_ADDRESS)];

module.exports = { ADDRESS };
