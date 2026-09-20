import { Skeleton, SkeletonStatTiles } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <SkeletonStatTiles count={4} />
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}
