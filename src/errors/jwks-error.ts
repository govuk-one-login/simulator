export class JwksError extends Error {
  constructor(errorDescription: string) {
    super();
    this.message = `${errorDescription}`;
  }
}
