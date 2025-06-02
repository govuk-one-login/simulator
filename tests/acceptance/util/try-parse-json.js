const tryParseJSON = (json) => {
  try {
    return JSON.stringify(json);
  } catch (
    _ // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    throw new Error("Failed to parse JSON");
  }
};

module.exports = {
  tryParseJSON,
};
