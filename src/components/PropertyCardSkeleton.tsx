interface PropertyCardSkeletonProps {
  count?: number;
}

/** Skeleton placeholder matching the addendum PropertyCard layout. */
export default function PropertyCardSkeleton({ count = 1 }: PropertyCardSkeletonProps): JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[438/342] rounded-tile bg-gray-200" />
          <div className="mt-2 flex h-[50px] items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-[30px] w-[30px] rounded-full bg-gray-200" />
              <div className="h-5 w-28 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-5">
              <div className="h-5 w-10 rounded-full bg-gray-100" />
              <div className="h-5 w-10 rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="mt-1 space-y-1">
            <div className="h-5 w-4/5 rounded-full bg-gray-200" />
            <div className="h-4 w-1/2 rounded-full bg-gray-100" />
            <div className="h-5 w-1/3 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}