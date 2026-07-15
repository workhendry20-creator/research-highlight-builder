export const SCHEMA_VERSION = 1;

/** A block never knows which page it lands on. Pages are computed, never stored. */
export type Block =
  | { id: string; type: 'paragraph'; text: string }
  | {
      id: string;
      type: 'figure';
      assetId: string;
      caption: string;
      /** 1 = one column wide, 'body' = full body width. No free dragging. */
      span: 1 | 'body';
      /** Caption text alignment. Absent = left (back-compat with v1 files). */
      align?: 'left' | 'center' | 'right';
    };

export interface Asset {
  /** data URL. Embedded into the .json so a saved file is self-contained. */
  src: string;
  naturalWidth: number;
  naturalHeight: number;
}

/** Structured, not free text. The sample PDF's broken DOI is what free text costs. */
export interface Reference {
  id: string;
  authors: string;
  title: string;
  journal: string;
  year: string;
  doi: string;
}

export interface Design {
  /** Body columns on page 1. Page 2 turns the sidebar slot into a text column. */
  bodyCols: 2 | 3 | 4;
  sidebar: boolean;
  /**
   * Where the highlights/references box sits. Absent = 'page1' (v1 files).
   * 'page1' = right rail, page 1 only. 'all' = right rail on every page.
   * 'below' = full-width block at the end of the article (in the text flow).
   * 'page1-flow' = single-column box at the end of the page-1 body flow, so
   *   body text fills the gap above it (col 4 top) before spilling to page 2.
   */
  highlightsPlacement?: 'page1' | 'all' | 'below' | 'page1-flow';
  fontDisplay: string;
  fontBody: string;
  colors: { hero: string; accent: string; accentSoft: string; ink: string };
  /** millimetres */
  margin: number;
  gutter: number;
  heroHeight: number;
  /** points */
  sizes: {
    categoryLabel: number;
    title: number;
    subtitle: number;
    author: number;
    affiliation: number;
    body: number;
  };
  /** Escape hatch. Injected raw into a <style> tag. */
  customCss: string;
}

export interface Doc {
  schemaVersion: number;
  meta: {
    categoryLabel: string;
    title: string;
    subtitle: string;
    author: string;
    affiliation: string;
  };
  blocks: Block[];
  highlights: string[];
  references: Reference[];
  hero: { assetId: string | null; offsetX: number; offsetY: number; scale: number };
  assets: Record<string, Asset>;
  design: Design;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyDoc = (): Doc => ({
  schemaVersion: SCHEMA_VERSION,
  meta: { categoryLabel: '', title: '', subtitle: '', author: '', affiliation: '' },
  blocks: [{ id: uid(), type: 'paragraph', text: '' }],
  highlights: [''],
  references: [],
  hero: { assetId: null, offsetX: 0, offsetY: 0, scale: 1 },
  assets: {},
  design: {
    bodyCols: 3,
    sidebar: true,
    highlightsPlacement: 'page1',
    fontDisplay: 'Source Serif 4',
    fontBody: 'Source Sans 3',
    colors: { hero: '#0F2A5C', accent: '#C8102E', accentSoft: '#FDE7EA', ink: '#111418' },
    margin: 16,
    gutter: 5,
    heroHeight: 95,
    sizes: {
      categoryLabel: 8.5,
      title: 30,
      subtitle: 12,
      author: 9,
      affiliation: 9,
      body: 9.4,
    },
    customCss: '',
  },
});

/** Bump this function, never the reader. Old files must keep opening. */
export function migrate(raw: any): Doc {
  if (raw.schemaVersion === SCHEMA_VERSION) return raw as Doc;
  throw new Error(`Unsupported file version: ${raw.schemaVersion}`);
}