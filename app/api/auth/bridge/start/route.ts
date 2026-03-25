import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createBridgeSession, parseBridgeStartInput } from "@/lib/auth/session-bridge";

export async function POST(request: Request) {
  try {
    const payload = parseBridgeStartInput(await request.json());
    const bridge = await createBridgeSession(payload);

    return NextResponse.json(bridge, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid bridge payload",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Unable to create bridge session" }, { status: 500 });
  }
}
