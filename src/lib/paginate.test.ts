import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

const budgetOverflow = (budget: number) => (el: HTMLElement) => (el.textContent?.length ?? 0) > budget;

describe('paginate', () => {
  it('loses no words across the page break, even when a paragraph straddles it', () => {
    const paragraphs = [
      'Paragraph zero holds a short introduction sentence used as page one filler content for the test.',
      'Paragraph one is intentionally long so that it straddles the break between page one and page two during pagination alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey.',
      'Paragraph two lands entirely on page two after the break in this pagination test scenario.',
    ];

    // Fixed budget: fits paragraph zero plus roughly half of paragraph one,
    // forcing the break to land inside paragraph one's word list.
    const budget = paragraphs[0].length + Math.floor(paragraphs[1].length / 2);
    const isOverflowing = budgetOverflow(budget);

    const host1 = document.createElement('div');
    const host2 = document.createElement('div');

    const result = paginate(host1, host2, paragraphs, isOverflowing);

    const originalWords = paragraphs.flatMap(words);
    const producedWords = [...result.page1, ...result.page2].flatMap((p) => words(p.text));
    expect(producedWords).toEqual(originalWords);

    expect(result.page2[0]?.cont).toBe(true);
  });
});
