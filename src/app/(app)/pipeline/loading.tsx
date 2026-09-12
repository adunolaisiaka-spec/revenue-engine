import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
