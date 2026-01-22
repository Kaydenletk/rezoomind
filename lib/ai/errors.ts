import type { AIErrorCode } from "@/types/ai";

export class AIServiceError extends Error {
  public readonly code: AIErrorCode;
  public readonly statusCode: number;
  public readonly retryAfter?: number;

  constructor(
    code: AIErrorCode,
    message: string,
    statusCode: number = 500,
    retryAfter?: number
  ) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      retryAfter: this.retryAfter,
    };
  }
}

export function isAIServiceError(error: unknown): error is AIServiceError {
  return error instanceof AIServiceError;
}
