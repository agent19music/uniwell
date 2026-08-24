import { queryKeys } from '@/lib/query/keys';

describe('query keys', () => {
  it('keeps feature keys stable and scoped', () => {
    expect(queryKeys.journals('user-1')).toEqual(['journals', 'user-1']);
    expect(queryKeys.community.feed()).toEqual(['community', 'feed', 'head']);
  });
});
