import Dexie, { type Table } from 'dexie';
import type { Doc } from '../schema/document';

/**
 * One document, one row. This app edits a single highlight at a time — the
 * store holds one Doc, Save/Open swaps it — so persistence is just a single
 * key-value row we overwrite. IndexedDB (not localStorage) because assets are
 * embedded as data URLs and can be megabytes.
 */
interface DocRow {
  id: 'current';
  doc: Doc;
  savedAt: number;
}

class RhbDb extends Dexie {
  docs!: Table<DocRow, string>;

  constructor() {
    super('rhb');
    this.version(1).stores({ docs: 'id' });
  }
}

const db = new RhbDb();

/** The persisted document, or null on a clean first run. */
export async function loadDoc(): Promise<Doc | null> {
  const row = await db.docs.get('current');
  return row ? row.doc : null;
}

/** Overwrite the single stored document. */
export async function saveDoc(doc: Doc): Promise<void> {
  await db.docs.put({ id: 'current', doc, savedAt: Date.now() });
}
