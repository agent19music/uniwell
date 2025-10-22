export const supabase = {
  auth: {
    getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
  },
}
