import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

// SecureStore only allows alphanumeric, ".", "-", "_" — sanitize the key before use
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

async function setItem(key: string, value: string) {
  const base = sanitizeKey(key);
  const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
  await SecureStore.setItemAsync(`${base}_n`, String(count));
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.setItemAsync(`${base}_chunk_${index}`, value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)),
    ),
  );
}

async function getItem(key: string) {
  const base = sanitizeKey(key);
  const countRaw = await SecureStore.getItemAsync(`${base}_n`);
  if (!countRaw) {
    return SecureStore.getItemAsync(base);
  }
  const count = Number(countRaw);
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${base}_chunk_${index}`)),
  );
  if (chunks.some((chunk) => chunk == null)) return null;
  return chunks.join('');
}

async function removeItem(key: string) {
  const base = sanitizeKey(key);
  const countRaw = await SecureStore.getItemAsync(`${base}_n`);
  const count = countRaw ? Number(countRaw) : 1;
  await Promise.all([
    SecureStore.deleteItemAsync(base).catch(() => undefined),
    SecureStore.deleteItemAsync(`${base}_n`).catch(() => undefined),
    ...Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(`${base}_chunk_${index}`).catch(() => undefined),
    ),
  ]);
}

export const secureAuthStorage = {
  getItem,
  setItem,
  removeItem,
};
