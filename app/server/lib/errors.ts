export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export abstract class ApplicationError extends Error {
  abstract status: number;
  abstract code: keyof typeof ErrorCode;

  abstract toResponse(): Response;
}

export class BadRequestError extends ApplicationError {
  status = 400;
  code = ErrorCode.BAD_REQUEST;

  constructor(
    public message: string,
    public detail?: unknown,
  ) {
    super(message);
  }

  toResponse() {
    return Response.json(
      { code: this.code, message: this.message, detail: this.detail },
      { status: this.status },
    );
  }
}

export class UnauthorizedError extends ApplicationError {
  status = 401;
  code = ErrorCode.UNAUTHORIZED;

  constructor(public message: string) {
    super(message);
  }

  toResponse() {
    return Response.json(
      { code: this.code, message: this.message },
      { status: this.status },
    );
  }
}

export class ForbiddenError extends ApplicationError {
  status = 403;
  code = ErrorCode.FORBIDDEN;

  constructor(public message: string) {
    super(message);
  }

  toResponse() {
    return Response.json(
      { code: this.code, message: this.message },
      { status: this.status },
    );
  }
}

export class NotFoundError extends ApplicationError {
  status = 404;
  code = ErrorCode.NOT_FOUND;

  constructor(public message: string) {
    super(message);
  }

  toResponse() {
    return Response.json(
      { code: this.code, message: this.message },
      { status: this.status },
    );
  }
}
