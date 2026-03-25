import { describe, expect, it } from "vitest";
import { isPrismaUnavailableError } from "@/lib/db/prisma-availability";

describe("isPrismaUnavailableError", () => {
  it("treats connection-refused codes as Prisma-unavailable errors", () => {
    expect(
      isPrismaUnavailableError({
        code: "ECONNREFUSED",
        message: "connect ECONNREFUSED 127.0.0.1:5432"
      })
    ).toBe(true);
  });

  it("does not hide unrelated errors", () => {
    expect(isPrismaUnavailableError(new Error("validation failed"))).toBe(false);
  });
});
