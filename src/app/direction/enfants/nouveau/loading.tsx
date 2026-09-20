import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-96" />
    </div>
  );
}
