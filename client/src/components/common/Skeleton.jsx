import React from "react";
import { cn } from "../../utils/classNames";

export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn("animate-pulse bg-slate-200 rounded-lg", className)}
    {...props}
  />
);

export const CardSkeleton = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-5 bg-white border border-slate-200 rounded-lg space-y-4"
      >
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    ))}
  </div>
);

export const GridItemSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-lg overflow-hidden border border-slate-200"
      >
        <Skeleton className="h-40 w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-8 w-full mt-2" />
        </div>
      </div>
    ))}
  </div>
);

export const TableRowSkeleton = ({ columns = 5, count = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg"
      >
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="flex-1 h-4" />
        ))}
      </div>
    ))}
  </div>
);

export const StatCardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-5 bg-white border border-slate-200 rounded-lg">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ImageSkeleton = ({ aspectRatio = "1", className }) => (
  <Skeleton
    className={cn(className)}
    style={{
      paddingBottom: `calc(100% / ${aspectRatio})`,
    }}
  />
);
