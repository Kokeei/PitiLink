import { Skeleton, SkeletonStatTiles } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
      <SkeletonStatTiles count={3} />
    </div>
  );
}
