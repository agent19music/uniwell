import { useInfiniteQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query/keys';

import { fetchCommunityFeed } from './api';

export function useCommunityFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.community.feed(),
    queryFn: ({ pageParam }) => fetchCommunityFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
