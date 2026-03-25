export type DirectorySortOption = "price" | "latency" | "successRate" | "recentPaidCalls";

export type DirectoryServiceStatus = "demo" | "comingSoon";

export type DirectoryService = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: string;
  successRate: number;
  avgLatencyMs: number;
  recentPaidCallCount: number;
  providerName: string;
  detailPath?: string | null;
  installPath: string;
  receiptPathTemplate: string;
  rejectedProofCount: number;
  status?: DirectoryServiceStatus;
};

export function sortDirectoryServices(
  services: DirectoryService[],
  sortBy: DirectorySortOption = "successRate"
) {
  return [...services].sort((left, right) => {
    if (sortBy === "price") {
      return Number(left.price.split(" ")[0]) - Number(right.price.split(" ")[0]);
    }

    if (sortBy === "latency") {
      return left.avgLatencyMs - right.avgLatencyMs;
    }

    if (sortBy === "recentPaidCalls") {
      return right.recentPaidCallCount - left.recentPaidCallCount;
    }

    return right.successRate - left.successRate;
  });
}
