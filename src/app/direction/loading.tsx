import { Skeleton, SkeletonStatTiles, SkeletonCard } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <SkeletonStatTiles count={6} />
      <SkeletonCard lines={3} />
    </div>
  );
}
