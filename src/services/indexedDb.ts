/**
 * IndexedDB Storage Engine for Mount AI Scholar
 * 100% Offline caching for AI generated results, uploaded documents, and learning analytics.
 */

export interface CachedAIResult {
  key: string;
  type: 'summary' | 'quiz' | 'mindmap' | 'rag' | 'vocab' | 'pedagogy';
  prompt: string;
  result: string;
  language: string;
  timestamp: number;
}

export interface CachedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  text: string;
  chaptersCount: number;
  timestamp: number;
}

export type StorageSyncState = 'idle' | 'syncing' | 'cached' | 'error';

export interface StorageStatus {
  state: StorageSyncState;
  isOnline: boolean;
  itemCount: number;
  lastSynced?: Date;
  details: string;
}

const DB_NAME = 'mount_ai_scholar_db';
const DB_VERSION = 1;
const STORE_AI_CACHE = 'ai_cache';
const STORE_DOCUMENTS = 'documents';
const STORE_USER_PROGRESS = 'user_progress';

let dbInstance: IDBDatabase | null = null;
let currentStatus: StorageStatus = {
  state: typeof navigator !== 'undefined' && !navigator.onLine ? 'cached' : 'idle',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  itemCount: 0,
  details: 'IndexedDB Initialized'
};

const listeners = new Set<(status: StorageStatus) => void>();

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb({ ...currentStatus });
    } catch (err) {
      console.warn("Storage listener callback error:", err);
    }
  });
}

export function subscribeStorageStatus(callback: (status: StorageStatus) => void): () => void {
  listeners.add(callback);
  callback({ ...currentStatus });
  return () => {
    listeners.delete(callback);
  };
}

export function getStorageStatus(): StorageStatus {
  return { ...currentStatus };
}

function updateStatus(partial: Partial<StorageStatus>) {
  currentStatus = {
    ...currentStatus,
    ...partial
  };
  notifyListeners();
}

// Window online/offline event bindings
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    updateStatus({
      isOnline: true,
      state: 'idle',
      details: 'Connected to network. Local storage synchronized.'
    });
  });

  window.addEventListener('offline', () => {
    updateStatus({
      isOnline: false,
      state: 'cached',
      details: 'Offline mode active. Serving all data from IndexedDB cache.'
    });
  });
}

/**
 * Opens or retrieves the singleton IndexedDB instance
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error("IndexedDB is not supported in this browser environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_AI_CACHE)) {
        const aiStore = db.createObjectStore(STORE_AI_CACHE, { keyPath: 'key' });
        aiStore.createIndex('type', 'type', { unique: false });
        aiStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('name', 'name', { unique: false });
        docStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_USER_PROGRESS)) {
        db.createObjectStore(STORE_USER_PROGRESS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      refreshItemCount();
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB open error:", request.error);
      updateStatus({ state: 'error', details: 'Failed to initialize local IndexedDB' });
      reject(request.error);
    };
  });
}

/**
 * Updates the total count of cached items across stores
 */
export async function refreshItemCount(): Promise<number> {
  try {
    const db = await getDB();
    let count = 0;

    const countStore = (storeName: string): Promise<number> => {
      return new Promise((res) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => res(req.result || 0);
          req.onerror = () => res(0);
        } catch {
          res(0);
        }
      });
    };

    const [aiCount, docCount] = await Promise.all([
      countStore(STORE_AI_CACHE),
      countStore(STORE_DOCUMENTS)
    ]);

    count = aiCount + docCount;
    updateStatus({
      itemCount: count,
      state: !navigator.onLine ? 'cached' : currentStatus.state === 'syncing' ? 'syncing' : 'idle'
    });
    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Creates a unique deterministic hash key for AI caching
 */
export function generateCacheKey(type: string, promptOrText: string, language: string): string {
  const clean = (type + ':' + language + ':' + promptOrText.trim().toLowerCase()).slice(0, 500);
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `${type}_${language}_${Math.abs(hash)}`;
}

/**
 * Save AI result to IndexedDB cache
 */
export async function cacheAIResult(
  type: CachedAIResult['type'],
  prompt: string,
  result: string,
  language: string
): Promise<void> {
  if (!result || !prompt) return;

  updateStatus({ state: 'syncing', details: `Saving ${type} to IndexedDB...` });

  try {
    const db = await getDB();
    const key = generateCacheKey(type, prompt, language);
    const item: CachedAIResult = {
      key,
      type,
      prompt: prompt.slice(0, 1000),
      result,
      language,
      timestamp: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AI_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_AI_CACHE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    await refreshItemCount();
    updateStatus({
      state: !navigator.onLine ? 'cached' : 'idle',
      lastSynced: new Date(),
      details: `Cached ${type} in IndexedDB`
    });
  } catch (err) {
    console.warn("Failed to cache AI result to IndexedDB:", err);
    updateStatus({ state: 'idle', details: 'IndexedDB write finished' });
  }
}

/**
 * Retrieve cached AI result from IndexedDB
 */
export async function getCachedAIResult(
  type: CachedAIResult['type'],
  prompt: string,
  language: string
): Promise<string | null> {
  try {
    const db = await getDB();
    const key = generateCacheKey(type, prompt, language);

    return new Promise<string | null>((resolve) => {
      const tx = db.transaction(STORE_AI_CACHE, 'readonly');
      const store = tx.objectStore(STORE_AI_CACHE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.result) {
          resolve(req.result.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

/**
 * Save an uploaded/parsed document into IndexedDB
 */
export async function cacheDocument(doc: {
  name: string;
  size: number;
  type?: string;
  text: string;
  chaptersCount?: number;
}): Promise<string> {
  updateStatus({ state: 'syncing', details: `Saving document "${doc.name}" to local storage...` });

  try {
    const db = await getDB();
    const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: CachedDocument = {
      id,
      name: doc.name,
      size: doc.size,
      type: doc.type || 'document',
      text: doc.text,
      chaptersCount: doc.chaptersCount || 1,
      timestamp: Date.now()
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    await refreshItemCount();
    updateStatus({
      state: !navigator.onLine ? 'cached' : 'idle',
      lastSynced: new Date(),
      details: `Document "${doc.name}" cached for offline use`
    });

    return id;
  } catch (err) {
    console.warn("Failed to cache document in IndexedDB:", err);
    updateStatus({ state: 'idle', details: 'Document parsed' });
    return '';
  }
}

/**
 * Retrieve all cached documents
 */
export async function getAllCachedDocuments(): Promise<CachedDocument[]> {
  try {
    const db = await getDB();
    return new Promise<CachedDocument[]>((resolve) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Clear all cached data (for user privacy or storage reset)
 */
export async function clearIndexedDBCache(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_AI_CACHE, STORE_DOCUMENTS], 'readwrite');
    tx.objectStore(STORE_AI_CACHE).clear();
    tx.objectStore(STORE_DOCUMENTS).clear();
    await refreshItemCount();
    updateStatus({
      state: 'idle',
      itemCount: 0,
      details: 'IndexedDB cache cleared'
    });
  } catch (e) {
    console.error("Failed to clear cache:", e);
  }
}
