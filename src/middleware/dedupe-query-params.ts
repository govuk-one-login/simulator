import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

export const dedupeQueryParams = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const queryParams = req.query;

  const dedupedParams = Object.entries(queryParams).reduce(
    (dedupedParams: Record<string, string | undefined>, [key, value]) => {
      if (typeof value === "string" || typeof value === "undefined") {
        dedupedParams[key] = value;
        return dedupedParams;
      } else if (
        Array.isArray(value) &&
        value.every(
          (param) => typeof param === "string" || typeof param === "undefined"
        )
      ) {
        //Express will parse multiple instances of the same query param key as an array
        //API gateway will ignore this and just use the last key-value pair in the path
        //So we want to emulate the same behaviour here
        dedupedParams[key] = value[value.length - 1];
        logger.warn(
          `Array of query params for key: "${key}" on path "${req.path}".` +
            " \n This could indicate multiple instances of the same query param key or an array syntax being used." +
            "\n These will be ignored and only the last instance of the key-value pair will be used"
        );
        return dedupedParams;
      } else {
        //Here the query param value is either an object or an array with some object values
        //We explicitly want to drop these as API gateway does not support these kind of query parameters
        //but the qs library express uses does
        //https://expressjs.com/en/api.html#app.set:~:text=The%20extended%20query%20parser%20is%20based%20on%20qs.
        //https://www.npmjs.com/package/qs#:~:text=qs%20allows%20you%20to%20create%20nested%20objects%20within%20your%20query%20strings%2C%20by%20surrounding%20the%20name%20of%20sub%2Dkeys%20with%20square%20brackets%20%5B%5D

        logger.warn(
          `Non primitive query param values for key: "${key}" on path ${req.path}, these will be dropped.` +
            `\n Values: ${JSON.stringify(value, null, 4)} `
        );
        return dedupedParams;
      }
    },
    {}
  );

  req.query = dedupedParams;
  next();
};
