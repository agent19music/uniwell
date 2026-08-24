import { queryKeys } from '@/lib/query/keys';

describe('community feed conventions', () => {
  it('pages with a cursor key instead of refreshing the whole feed', () => {
    expect(queryKeys.community.feed('2026-01-01T00:00:00.000Z')).toEqual([
      'community',
      'feed',
      '2026-01-01T00:00:00.000Z',
    ]);
  });
});
