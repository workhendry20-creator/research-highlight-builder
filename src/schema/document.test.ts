import { describe, expect, it } from 'vitest';
import { migrate, emptyDoc, SCHEMA_VERSION } from './document';

describe('migrate', () => {
  it('returns a current-version doc unchanged', () => {
    const doc = emptyDoc();
    expect(migrate(doc)).toBe(doc);
  });

  it('upgrades a v1 file to the current version (equation blocks are additive)', () => {
    // A v1 doc has only paragraph/figure blocks and no schemaVersion 2 features.
    const v1 = { ...emptyDoc(), schemaVersion: 1 };
    const out = migrate(v1);
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    // Existing content survives untouched.
    expect(out.blocks).toEqual(v1.blocks);
    expect(out.meta).toEqual(v1.meta);
  });

  it('rejects an unknown future version instead of silently accepting it', () => {
    const future = { ...emptyDoc(), schemaVersion: SCHEMA_VERSION + 1 };
    expect(() => migrate(future)).toThrow();
  });
});
