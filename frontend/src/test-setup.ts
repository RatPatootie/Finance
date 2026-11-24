// jsdom has no IndexedDB. Install an in-memory one before any spec (and Dexie) loads.
import 'fake-indexeddb/auto';
