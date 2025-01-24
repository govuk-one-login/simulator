export class MethodNotAllowedError extends Error {
  constructor(httpMethod: string) {
    super(`Method "${httpMethod} not allowed"`);
  }
}
