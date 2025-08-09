const store: Record<string, string> = {}

const AsyncStorage = {
  getItem: jest.fn(async (key: string) => store[key] ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    store[key] = value
  }),
  removeItem: jest.fn(async (key: string) => {
    delete store[key]
  }),
  clear: jest.fn(async () => {
    for (const k of Object.keys(store)) delete store[k]
  }),
  multiGet: jest.fn(async (keys: string[]) => keys.map((k) => [k, store[k] ?? null])),
}

export default AsyncStorage
export { AsyncStorage }
