import { Response, Request } from "express";
import { dedupeQueryParams } from "../dedupe-query-params";

describe("dedupeQueryParams tests", () => {
  it("returns string and undefined query params", () => {
    const mockReq = {
      query: {
        key: "val",
        key1: "val1",
        key2: undefined,
      },
      path: "/endpoint",
    } as unknown as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    dedupeQueryParams(mockReq, mockRes, mockNext);
    expect(mockReq.query).toStrictEqual({
      key: "val",
      key1: "val1",
      key2: undefined,
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns the last instance of an array of query params", () => {
    const mockReq = {
      query: {
        key: "val",
        key1: ["val1", "val2", "val3"],
        key2: undefined,
      },
      path: "/endpoint",
    } as unknown as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    dedupeQueryParams(mockReq, mockRes, mockNext);
    expect(mockReq.query).toStrictEqual({
      key: "val",
      key1: "val3",
      key2: undefined,
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("ignores any object query params", () => {
    const mockReq = {
      query: {
        key: "val",
        key1: ["val1", "val2", "val3"],
        key2: {
          someOtherKey: "val4",
        },
      },
      path: "/endpoint",
    } as unknown as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    dedupeQueryParams(mockReq, mockRes, mockNext);
    expect(mockReq.query).toStrictEqual({
      key: "val",
      key1: "val3",
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it("handles a mixture of cases", () => {
    const mockReq = {
      query: {
        key: "val",
        key1: ["val1", "val2", "val3"],
        key2: undefined,
        key3: {
          someOtherKey: "val4",
        },
      },
      path: "/endpoint",
    } as unknown as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    dedupeQueryParams(mockReq, mockRes, mockNext);
    expect(mockReq.query).toStrictEqual({
      key: "val",
      key1: "val3",
      key2: undefined,
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
