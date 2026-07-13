import { afterEach, describe, expect, it } from 'vitest';
import { hydrate } from './persist';
import { useDoc } from './useDoc';
import { emptyDoc, SCHEMA_VERSION, type Doc } from '../schema/document';

// hydrate() takes an injected reader, so we can exercise the restore/seed
// decision without a real IndexedDB (jsdom has none). Same spirit as
// paginate() taking an injected isOverflowing.

afterEach(() => {
  useDoc.getState().load(emptyDoc());
});

describe('hydrate', () => {
  it('restores a valid stored document into the store', async () => {
    const stored = emptyDoc();
    stored.meta.title = 'Restored from storage';

    const result = await hydrate(async () => stored);

    expect(result).toBe('restored');
    expect(useDoc.getState().doc.meta.title).toBe('Restored from storage');
  });

  it('reports empty and leaves the store untouched when nothing is stored', async () => {
    const before = useDoc.getState().doc;

    const result = await hydrate(async () => null);

    expect(result).toBe('empty');
    expect(useDoc.getState().doc).toBe(before);
  });

  it('degrades to empty on an unsupported schema version instead of crashing', async () => {
    const before = useDoc.getState().doc;
    const stale = { ...emptyDoc(), schemaVersion: SCHEMA_VERSION + 1 } as unknown as Doc;

    const result = await hydrate(async () => stale);

    expect(result).toBe('empty');
    expect(useDoc.getState().doc).toBe(before);
  });

  it('degrades to empty when the reader throws', async () => {
    const result = await hydrate(async () => {
      throw new Error('storage unavailable');
    });

    expect(result).toBe('empty');
  });
});
