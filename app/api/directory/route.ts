import { NextResponse } from "next/server";
import { buildLiveDirectory } from "@/lib/services/discovery/directory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get("sortBy");
  const directory = await buildLiveDirectory({
    sortBy:
      sortBy === "price" ||
      sortBy === "latency" ||
      sortBy === "successRate" ||
      sortBy === "recentPaidCalls"
        ? sortBy
        : "successRate"
  });

  return NextResponse.json({
    services: directory
  });
}
