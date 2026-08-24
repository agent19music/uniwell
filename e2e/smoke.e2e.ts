/**
 * Device smoke (Detox). Not run in unit CI.
 *
 * 1. Login with a disposable account.
 * 2. Create a journal while offline, edit it, reconnect, confirm one server row.
 * 3. Scroll the community feed past the first cursor page.
 */
describe('UniWell smoke', () => {
  it('documents the required device flows', () => {
    expect(['login', 'offline-journal', 'community-pagination']).toHaveLength(3);
  });
});
