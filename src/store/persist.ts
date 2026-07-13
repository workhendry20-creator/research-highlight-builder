import { useDoc } from './useDoc';
import { migrate, type Doc } from '../schema/document';
import { loadDoc, saveDoc } from './db';

/**
 * Persistence lives outside the store: it subscribes to useDoc rather than
 * being baked into it, so useDoc.ts stays untouched (house rule).
 */

type HydrateResult = 'restored' | 'empty';

/**
 * Pull the last document out of storage into the store.
 *
 * `reader` is injectable so the decision logic can be tested without a real
 * IndexedDB (same trick paginate() uses with isOverflowing). Storage errors
 * and unsupported versions degrade to 'empty' instead of blocking boot — the
 * caller then seeds a fresh sample.
 */
export async function hydrate(reader: () => Promise<Doc | null> = loadDoc): Promise<HydrateResult> {
  let raw: Doc | null;
  try {
    raw = await reader();
  } catch {
    return 'empty';
  }
  if (!raw) return 'empty';
  try {
    useDoc.getState().load(migrate(raw));
    return 'restored';
  } catch {
    // Unknown/unsupported schema version — don't clobber the store.
    return 'empty';
  }
}

/**
 * Mirror every store change to IndexedDB, debounced so a burst of keystrokes
 * writes once. Returns an unsubscribe for effect cleanup.
 */
export function startAutosave(delay = 600): () => void {
  let t: ReturnType<typeof setTimeout>;
  const unsubscribe = useDoc.subscribe(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      void saveDoc(useDoc.getState().doc);
    }, delay);
  });
  return () => {
    clearTimeout(t);
    unsubscribe();
  };
}
