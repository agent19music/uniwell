import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

async function setItem(key: string, value: string) {
  const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
  await SecureStore.setItemAsync(`${key}#n`, String(count));
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.setItemAsync(`${key}#${index}`, value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)),
    ),
  );
}

async function getItem(key: string) {
  const countRaw = await SecureStore.getItemAsync(`${key}#n`);
  if (!countRaw) {
    return SecureStore.getItemAsync(key);
  }
  const count = Number(countRaw);
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}#${index}`)),
  );
  if (chunks.some((chunk) => chunk == null)) return null;
  return chunks.join('');
}

async function removeItem(key: string) {
  const countRaw = await SecureStore.getItemAsync(`${key}#n`);
  const count = countRaw ? Number(countRaw) : 1;
  await Promise.all([
    SecureStore.deleteItemAsync(key).catch(() => undefined),
    SecureStore.deleteItemAsync(`${key}#n`).catch(() => undefined),
    ...Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(`${key}#${index}`).catch(() => undefined),
    ),
  ]);
}

export const secureAuthStorage = {
  getItem,
  setItem,
  removeItem,
};
