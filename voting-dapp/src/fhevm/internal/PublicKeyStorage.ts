const DB_NAME = "fhevm";
const STORE_NAME = "keys";

interface KeyData {
  publicKey: string;
  publicParams: string;
}

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function publicKeyStorageGet(
  contractAddress: string
): Promise<KeyData> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(contractAddress);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          resolve(data);
        } else {
          // Return default empty keys if not found
          resolve({
            publicKey: "",
            publicParams: "",
          });
        }
      };
    });
  } catch (error) {
    console.warn("Failed to get public key from storage:", error);
    return {
      publicKey: "",
      publicParams: "",
    };
  }
}

export async function publicKeyStorageSet(
  contractAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(
        {
          publicKey,
          publicParams,
        },
        contractAddress
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn("Failed to save public key to storage:", error);
  }
}
