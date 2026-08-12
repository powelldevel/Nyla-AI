import { AppError, type AppErrorOptions } from "./app-error";

export { AppError } from "./app-error";
export type { AppErrorCode, AppErrorOptions } from "./app-error";

export class ValidationError extends AppError {
  constructor(message = "The request is invalid.", options?: AppErrorOptions) {
    super(message, { code: "VALIDATION_ERROR", retryable: false, statusCode: 400 }, options);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication is required.", options?: AppErrorOptions) {
    super(message, { code: "AUTHENTICATION_ERROR", retryable: false, statusCode: 401 }, options);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = "You are not authorized to perform this action.",
    options?: AppErrorOptions,
  ) {
    super(message, { code: "AUTHORIZATION_ERROR", retryable: false, statusCode: 403 }, options);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "The request conflicts with the current state.",
    options?: AppErrorOptions,
  ) {
    super(message, { code: "CONFLICT_ERROR", retryable: false, statusCode: 409 }, options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.", options?: AppErrorOptions) {
    super(message, { code: "NOT_FOUND_ERROR", retryable: false, statusCode: 404 }, options);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Try again later.", options?: AppErrorOptions) {
    super(message, { code: "RATE_LIMIT_ERROR", retryable: true, statusCode: 429 }, options);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred.", options?: AppErrorOptions) {
    super(message, { code: "INTERNAL_SERVER_ERROR", retryable: false, statusCode: 500 }, options);
  }
}
