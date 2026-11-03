import Grid from 'components/grid';

export default function Loading() {
  return (
    <>
      {/* Skeleton heading */}
      <div className="mb-7">
        <div className="mb-3 h-2 w-24 animate-pulse rounded-full bg-[#dce8c7]" />
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#dce8c7]" />
        <div className="mt-2 h-[3px] w-9 rounded-full bg-[#dce8c7]" />
      </div>

      {/* Skeleton product grid */}
      <Grid className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array(9)
          .fill(0)
          .map((_, index) => (
            <li
              key={index}
              className="animate-pulse"
            >
              {/* Image placeholder */}
              <div className="aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-[#dde8d6] to-[#c8d9bc]" />
              {/* Text placeholders */}
              <div className="mt-3 flex justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-[#dce8c7]" />
                  <div className="h-2.5 w-1/2 rounded bg-[#e6ede2]" />
                </div>
                <div className="h-3 w-12 rounded bg-[#dce8c7]" />
              </div>
            </li>
          ))}
      </Grid>
    </>
  );
}
