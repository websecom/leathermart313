import { getCollections } from 'lib/store';
import { Suspense } from 'react';
import FilterList from './filter';

async function CollectionList() {
  const collections = await getCollections();
  return <FilterList list={collections} title="Shop categories" />;
}

export default function Collections() {
  return (
    <Suspense
      fallback={
        <div className="space-y-1.5 py-1">
          {/* Heading skeleton */}
          <div className="mb-3 h-2 w-28 animate-pulse rounded-full bg-[#dce8c7]" />
          {/* Item skeletons */}
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded-lg bg-[#e6ede2]"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
        </div>
      }
    >
      <CollectionList />
    </Suspense>
  );
}
