import { Prisma } from "@prisma/client";

function hasCode(value: unknown): value is { code: string } {
  return value !== null && typeof value === "object" && "code" in value;
}

export function isPrismaUnavailableError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code.startsWith("P1")) {
      return true;
    }

    if (error.code === "ECONNREFUSED") {
      return true;
    }
  }

  if (hasCode(error)) {
    const { code } = error;
    if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
      return true;
    }
  }

  return (
    error instanceof Error &&
    /(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Can't reach database server|database server|Prisma Client is unable to run|Prisma is unavailable|Prisma unavailable)/i.test(
      error.message
    )
  );
}
