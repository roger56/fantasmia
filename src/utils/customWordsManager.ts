/**
 * Gestione parole custom per "Conosci la Parola"
 * Salva e recupera parole aggiunte dal SU in IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface WordEntryIT {
  word: string;
  definition: string;
}

interface WordEntryEN {
  word: string;
  meaningEN: string;
  meaningIT: string;
  translationIT: string;
}

interface CustomWordsDB extends DBSchema {
  'custom-words-it': {
    key: string;
    value: WordEntryIT;
  };
  'custom-words-en': {
    key: string;
    value: WordEntryEN;
  };
}

const DB_NAME = 'fantasmia-custom-words';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CustomWordsDB> | null = null;

const getDB = async (): Promise<IDBPDatabase<CustomWordsDB>> => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<CustomWordsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('custom-words-it')) {
        db.createObjectStore('custom-words-it', { keyPath: 'word' });
      }
      if (!db.objectStoreNames.contains('custom-words-en')) {
        db.createObjectStore('custom-words-en', { keyPath: 'word' });
      }
    },
  });
  
  return dbInstance;
};

// Italian words
export const addCustomWordIT = async (word: WordEntryIT): Promise<void> => {
  const db = await getDB();
  await db.put('custom-words-it', word);
};

export const getCustomWordsIT = async (): Promise<WordEntryIT[]> => {
  const db = await getDB();
  return db.getAll('custom-words-it');
};

export const deleteCustomWordIT = async (word: string): Promise<void> => {
  const db = await getDB();
  await db.delete('custom-words-it', word);
};

// English words
export const addCustomWordEN = async (word: WordEntryEN): Promise<void> => {
  const db = await getDB();
  await db.put('custom-words-en', word);
};

export const getCustomWordsEN = async (): Promise<WordEntryEN[]> => {
  const db = await getDB();
  return db.getAll('custom-words-en');
};

export const deleteCustomWordEN = async (word: string): Promise<void> => {
  const db = await getDB();
  await db.delete('custom-words-en', word);
};

export type { WordEntryIT, WordEntryEN };
