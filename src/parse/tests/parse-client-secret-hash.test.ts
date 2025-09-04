import { parseClientSecretHashIntoParams } from "../parse-client-secret-hash";

describe("parseClientSecretHashTests tests", () => {
  it("parses a valid argon2 hash into its parameters", () => {
    const validHash =
      "$argon2id$v=19$m=65536,t=3,p=4$mZPjoGhypn0Za59ScrDehA$vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY";

    expect(parseClientSecretHashIntoParams(validHash)).toStrictEqual({
      hash: Buffer.from(
        "vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY",
        "base64"
      ),
      options: {
        salt: Buffer.from("mZPjoGhypn0Za59ScrDehA", "base64"),
        version: 19,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      },
    });
  });

  it("throws if the hash does not split on $ into at least 4 parts", () => {
    expect(() => parseClientSecretHashIntoParams("$")).toThrow();
  });

  it("throws if there is a missing performance params ", () => {
    // missing parallelism
    expect(() =>
      parseClientSecretHashIntoParams(
        "$argon2id$v=19$m=65536,t=3$mZPjoGhypn0Za59ScrDehA$vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY"
      )
    ).toThrow();
  });

  it("throws if the memory cost is not first in the performance params", () => {
    expect(() =>
      parseClientSecretHashIntoParams(
        "$argon2id$v=19$t=3,p=4,m=65536$mZPjoGhypn0Za59ScrDehA$vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY"
      )
    ).toThrow();
  });

  it("throws if the time cost is not second in the performance params", () => {
    expect(() =>
      parseClientSecretHashIntoParams(
        "$argon2id$v=19$m=65536,p=4,t=3$mZPjoGhypn0Za59ScrDehA$vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY"
      )
    ).toThrow();
  });

  it("throws if the parallelism is not last in the performance params", () => {
    expect(() =>
      //x is a made up param
      parseClientSecretHashIntoParams(
        "$argon2id$v=19$m=65536,t=3,x=4$mZPjoGhypn0Za59ScrDehA$vwlByTzODE0z1Aj8wRAo7qJ+ZKrM/cP+CgEKowvwNgY"
      )
    ).toThrow();
  });
});
