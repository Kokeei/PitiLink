import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}
