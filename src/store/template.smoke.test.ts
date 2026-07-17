import { describe, expect, it } from 'vitest';
import { useDoc } from './useDoc';
import { presetFor, TEMPLATES, TEMPLATE_META } from './presets';
import { familyOf } from '../schema/document';

describe('template registry', () => {
  it('has two families with 3+ templates each', () => {
    const paper = TEMPLATE_META.filter((t) => t.family === 'paper');
    const magazine = TEMPLATE_META.filter((t) => t.family === 'magazine');
    expect(paper.length).toBeGreaterThanOrEqual(3);
    expect(magazine.length).toBeGreaterThanOrEqual(3);
  });

  it('every preset carries a matching templateId and family', () => {
    for (const t of TEMPLATES) {
      const doc = t.make();
      expect(doc.templateId).toBe(t.id);
      expect(familyOf(doc.templateId)).toBe(t.family);
    }
  });

  it('magazine presets ship a hero photo and pull-quote; each has its own accent', () => {
    const mags = TEMPLATES.filter((t) => t.family === 'magazine').map((t) => t.make());
    for (const d of mags) {
      expect(d.hero.assetId).toBeTruthy();
      expect(d.meta.pullQuote).toBeTruthy();
    }
    const accents = mags.map((d) => d.design.colors.accent);
    expect(new Set(accents).size).toBe(accents.length); // all distinct
  });

  it('presetFor returns fresh docs (independent asset ids)', () => {
    const a = presetFor('magazine-2');
    const b = presetFor('magazine-2');
    expect(a.hero.assetId).not.toBe(b.hero.assetId);
  });

  it('switchTemplate loads any template into the store', () => {
    useDoc.getState().switchTemplate('magazine-2');
    expect(useDoc.getState().doc.templateId).toBe('magazine-2');
    expect(useDoc.getState().doc.meta.title).toBe('TUMBUKAN DI JANTUNG MATERI');

    useDoc.getState().switchTemplate('paper-3');
    expect(useDoc.getState().doc.templateId).toBe('paper-3');
    // 3 body columns + the highlights rail = the 4-column spread paper-3 draws.
    expect(useDoc.getState().doc.design.bodyCols).toBe(3);
  });
});
