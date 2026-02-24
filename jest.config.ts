export default {
  clearMocks: true,
  collectCoverage: true,
  preset: "ts-jest",
  collectCoverageFrom: ["src/**/*.ts"],
  transformIgnorePatterns: ["/node_modules/(?!@jose)"],
};
