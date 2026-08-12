export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "CONFLICT_ERROR"
  | "NOT_FOUND_ERROR"
  | "RATE_LIMIT_ERROR"
  | "INTERNAL_SERVER_ERROR";

export type AppErrorOptions = Readonly<{
  cause?: unknown;
  details?: Readonly<Record<string, unknown>>;
}>;

type AppErrorDefinition = Readonly<{
  code: AppErrorCode;
  retryable: boolean;
  statusCode: number;
}>;

export abstract class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly retryable: boolean;
  readonly statusCode: number;

  protected constructor(
    message: string,
    definition: AppErrorDefinition,
    options: AppErrorOptions = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = definition.code;
    this.details = options.details;
    this.retryable = definition.retryable;
    this.statusCode = definition.statusCode;
  }
}
