import React from "react";
import { HomePageContent } from "@/components/home/home-page-content";
import { buildLiveDirectory } from "@/lib/services/discovery/directory";

export default async function HomePage() {
  const previewServices = (await buildLiveDirectory({ sortBy: "recentPaidCalls" })).slice(0, 3);

  return <HomePageContent previewServices={previewServices} />;
}
