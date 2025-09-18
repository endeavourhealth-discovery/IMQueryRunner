export default class AuthorizationError extends Error {
  private readonly _errorCode: number | undefined;
  private readonly _details: string | undefined;

  constructor(error: { message: string, code?: number, details?: string }) {
    super(error.message);
    this.name = "AuthorizationException";
    this._errorCode = error.code;
    this._details = error.details;
  }

  get errorCode(): number | undefined {
    return this._errorCode;
  }

  get details(): string | undefined {
    return this._details;
  }
}