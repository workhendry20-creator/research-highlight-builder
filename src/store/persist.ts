import { useDoc } from './useDoc';
import { migrate, type Doc } from '../schema/document';
import { loadDoc, saveDoc } from './db';
import { useSaveStatus } from './saveStatus';

/**
 * Persistence lives outside the store: it subscribes to useDoc rather than
 * being baked into it, so useDoc.ts stays untouched (house rule).
 */

export type HydrateResult = 'restored' | 'empty' | 'error';

/**
 * Pull the last document out of storage into the store.
 *
 * `reader` is injectable so the decision logic can be tested without a real
 * IndexedDB (same trick paginate() uses with isOverflowing).
 *
 *  - 'restored'  a stored doc was read and loaded
 *  - 'empty'     clean first run, or a stored-but-unsupported version — safe to seed a sample
 *  - 'error'     the read itself failed; the caller must NOT seed/overwrite, or a
 *                real (temporarily unreadable) doc gets clobbered by the next autosave
 */
export async function hydrate(reader: () => Promise<Doc | null> = loadDoc): Promise<HydrateResult> {
  let raw: Doc | null;
  try {
    raw = await reader();
  } catch {
    // Storage read failed — distinct from an empty store. Don't pretend it's blank.
    return 'error';
  }
  if (!raw) return 'empty';
  try {
    useDoc.getState().load(migrate(raw));
    return 'restored';
  } catch {
    // Unknown/unsupported schema version — nothing to restore, but the store is
    // intact and seeding a sample is fine.
    return 'empty';
  }
}

/**
 * Mirror every store change to IndexedDB, debounced so a burst of keystrokes
 * writes once. Returns an unsubscribe for effect cleanup.
 */
export function startAutosave(delay = 600): () => void {
  let t: ReturnType<typeof setTimeout>;
  const { setStatus } = useSaveStatus.getState();
  const unsubscribe = useDoc.subscribe(() => {
    clearTimeout(t);
    setStatus('saving');
    t = setTimeout(() => {
      saveDoc(useDoc.getState().doc).then(
        () => setStatus('saved'),
        // Quota exceeded or a blocked/broken IndexedDB — surface it instead of
        // letting the rejection go unhandled and the loss go unnoticed.
        () => setStatus('error'),
      );
    }, delay);
  });
  return () => {
    clearTimeout(t);
    unsubscribe();
  };
}
