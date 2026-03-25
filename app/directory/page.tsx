import React from "react";
import { buildLiveDirectory } from "@/lib/services/discovery/directory";
import { buildDirectoryShowcase } from "@/lib/services/discovery/showcase-directory";
import { DirectoryDiscoveryView } from "@/components/directory/directory-discovery-view";
import { getDirectorySort } from "@/lib/content/directory-copy";

type DirectoryPageProps = {
  searchParams?: Promise<{
    sortBy?: string;
  }>;
};

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedSort = getDirectorySort(resolvedSearchParams?.sortBy);
  const liveServices = await buildLiveDirectory({ sortBy: selectedSort });
  const services = buildDirectoryShowcase(liveServices, { sortBy: selectedSort });

  return <DirectoryDiscoveryView services={services} selectedSort={selectedSort} />;
}
