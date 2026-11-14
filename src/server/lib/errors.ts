export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(error: unknown): {
  status: number;
  body: { error: { code: string; message: string; details?: unknown } };
} {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "ZodError"
  ) {
    return {
      status: 400,
      body: {
        error: {
          code: "validation_error",
          message: "Invalid request",
          details: (error as { issues?: unknown }).issues,
        },
      },
    };
  }
  console.error(error);
  return {
    status: 500,
    body: {
      error: { code: "internal_error", message: "Unexpected server error" },
    },
  };
}
