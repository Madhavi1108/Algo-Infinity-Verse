/**
 * IndexedDB Wrapper for Offline Storage
 * Handles caching of DSA problems, user progress, and visualizer states.
 */

const DB_NAME = 'AlgoInfinityVerseDB';
const DB_VERSION = 1;

class OfflineStore {
    constructor() {
        this.db = null;
        this.initPromise = this.initDB();
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for DSA Problems
                if (!db.objectStoreNames.contains('problems')) {
                    db.createObjectStore('problems', { keyPath: 'id' });
                }
                
                // Store for User Progress
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'id' });
                }
                
                // Store for Visualizer States
                if (!db.objectStoreNames.contains('visualizers')) {
                    db.createObjectStore('visualizers', { keyPath: 'id' });
                }
                
                // Store for Bookmarks
                if (!db.objectStoreNames.contains('bookmarks')) {
                    db.createObjectStore('bookmarks', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB init error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async getStore(storeName, mode = 'readonly') {
        await this.initPromise;
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    async get(storeName, id) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const store = await this.getStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const store = await this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export a singleton instance
export const offlineStore = new OfflineStore();
