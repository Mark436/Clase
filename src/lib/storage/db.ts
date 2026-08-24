const DB_NAME = "pwa-academica";
const DB_VERSION = 1;

export const STORE_APP_DATA = "app-data";
export const STORE_GRADE_TRACKING = "grade-tracking";
export const STORE_SETTINGS = "settings";

const ALL_STORES = [STORE_APP_DATA, STORE_GRADE_TRACKING, STORE_SETTINGS];

export class StorageUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("El almacenamiento local no está disponible.", options);
    this.name = "StorageUnavailableError";
  }
}

interface StoreEntry<T> {
  key: IDBValidKey;
  value: T;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      reject(new StorageUnavailableError({ cause: error }));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of ALL_STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new StorageUnavailableError({ cause: request.error ?? undefined }));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operate: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const request = operate(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () =>
        reject(new StorageUnavailableError({ cause: request.error ?? undefined }));
    });
  } finally {
    db.close();
  }
}

export async function getValue<T>(
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  return withStore<T | undefined>(storeName, "readonly", (store) =>
    store.get(key),
  );
}

export async function getAllValues<T>(storeName: string): Promise<T[]> {
  return withStore<T[]>(storeName, "readonly", (store) => store.getAll());
}

export async function putValue<T>(
  storeName: string,
  entry: StoreEntry<T>,
): Promise<void> {
  await withStore(storeName, "readwrite", (store) =>
    store.put(entry.value, entry.key),
  );
}

export async function putAllValues<T>(
  storeName: string,
  entries: ReadonlyArray<StoreEntry<T>>,
): Promise<void> {
  if (entries.length === 0) return;

  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      for (const entry of entries) {
        store.put(entry.value, entry.key);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new StorageUnavailableError({ cause: transaction.error ?? undefined }),
        );
      transaction.onabort = () =>
        reject(
          new StorageUnavailableError({ cause: transaction.error ?? undefined }),
        );
    });
  } finally {
    db.close();
  }
}

export async function removeValue(
  storeName: string,
  key: IDBValidKey,
): Promise<void> {
  await withStore(storeName, "readwrite", (store) => store.delete(key));
}

export async function clearAllStores(): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(ALL_STORES, "readwrite");
      for (const name of ALL_STORES) {
        transaction.objectStore(name).clear();
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new StorageUnavailableError({ cause: transaction.error ?? undefined }),
        );
    });
  } finally {
    db.close();
  }
}
