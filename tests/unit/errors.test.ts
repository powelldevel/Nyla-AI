import { describe, expect, it } from "vitest";

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "@/lib/errors";

describe("typed application errors", () => {
  it.each([
    [new ValidationError(), "VALIDATION_ERROR", 400, false],
    [new AuthenticationError(), "AUTHENTICATION_ERROR", 401, false],
    [new AuthorizationError(), "AUTHORIZATION_ERROR", 403, false],
    [new NotFoundError(), "NOT_FOUND_ERROR", 404, false],
    [new ConflictError(), "CONFLICT_ERROR", 409, false],
    [new RateLimitError(), "RATE_LIMIT_ERROR", 429, true],
    [new InternalServerError(), "INTERNAL_SERVER_ERROR", 500, false],
  ])("maps %s to a safe HTTP definition", (error, code, statusCode, retryable) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);
    expect(error.retryable).toBe(retryable);
  });
});
