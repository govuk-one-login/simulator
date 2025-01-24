export class TrustChainValidationError extends Error {
  constructor() {
    super(`Trust chain validation failed`);
  }
}
