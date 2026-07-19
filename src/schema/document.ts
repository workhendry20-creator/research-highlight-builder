export const SCHEMA_VERSION = 1;

/** Template family = which layout engine renders the document. */
export type TemplateFamily = 'paper' | 'magazine' | 'gallery';

/** A specific template. The family (engine) is the id's prefix; the number picks
 *  a preset (content + design tokens) within that engine. */
export type TemplateId =
  | 'paper-1'
  | 'paper-2'
  | 'paper-3'
  | 'magazine-1'
  | 'magazine-2'
  | 'magazine-3'
  | 'gallery-1';

/** The layout engine a template runs on — derived from the id, never stored. */
export const familyOf = (id: TemplateId | undefined): TemplateFamily =>
  id?.startsWith('gallery') ? 'gallery' : id?.startsWith('magazine') ? 'magazine' : 'paper';

/** A block never knows which page it lands on. Pages are computed, never stored. */
export type Block =
  | { id: string; type: 'paragraph'; text: string }
  | {
      id: string;
      type: 'figure';
      assetId: string;
      caption: string;
      /**
       * 1 = one column wide, 'body' = full body width, 'bleed' = full body width
       * carried out past the page margin to the sheet edge. No free dragging —
       * every one of these still anchors to its paragraph in the flow.
       */
      span: 1 | 'body' | 'bleed';
      /** Caption text alignment. Absent = left (back-compat with v1 files). */
      align?: 'left' | 'center' | 'right';
      /**
       * Zoom/pan of the image inside its box, used by the gallery tiles to
       * reframe a photo without changing the tile size. Absent = fill (scale 1,
       * no shift). scale ≥ 1; offsets are percent of the box.
       */
      frame?: { scale: number; offsetX: number; offsetY: number };
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
  /** Body paragraph alignment. Absent = 'justify' (v1 files kept their look). */
  bodyAlign?: 'left' | 'center' | 'right' | 'justify';
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
  /**
   * Per-element font overrides. Absent = inherit the family that element used
   * before this setting existed (category/author/affiliation → body, subtitle →
   * display), so v1 files keep their exact look. See cssVars() for the mapping.
   */
  fontCategory?: string;
  fontSubtitle?: string;
  fontAuthor?: string;
  fontAffiliation?: string;
  colors: { hero: string; accent: string; accentSoft: string; ink: string };
  /**
   * Gallery sheet background. Absent = white. The gallery reads it as `--paper-bg`
   * and derives a readable text colour (`--paper-ink`, black on light / white on
   * dark) from its luminance, so titles/labels stay legible on any colour.
   */
  paperBg?: string;
  /**
   * paper-2's top band. Absent = the defaults below, so v1 files and the other
   * templates (which never draw the band) are unaffected.
   * `barColor` = the rule itself, `barTagColor` = the block holding the tag
   * text, `barTagInk` = that text.
   */
  barColor?: string;
  barTagColor?: string;
  barTagInk?: string;
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
  /** Active layout template. Absent = 'paper-1' (v1 files keep their layout). */
  templateId?: TemplateId;
  meta: {
    categoryLabel: string;
    title: string;
    subtitle: string;
    author: string;
    affiliation: string;
    /** Magazine-only fields (ignored by paper-1). All optional for back-compat. */
    /** Masthead logo/name on the cover + spread header, e.g. "KUANTA".
     *  paper-2 reuses it as the tag text inside its top band. */
    masthead?: string;
    /** Caption under paper-2's top-right hero. */
    heroCaption?: string;
    /** Volume/date line, e.g. "VOL. IX · NO.2 · MARET 2026". */
    volume?: string;
    /** Location tag overlaid on the page-2 hero photo. */
    location?: string;
    /** Pull-quote body shown inside the spread. */
    pullQuote?: string;
    /** Pull-quote attribution, e.g. "— DR. ARIA PRATAMA, FEB 2026". */
    pullQuoteBy?: string;
    /** Credit line under the spread hero photo. */
    photoCredit?: string;
  };
  blocks: Block[];
  highlights: string[];
  references: Reference[];
  hero: { assetId: string | null; offsetX: number; offsetY: number; scale: number };
  /**
   * Page-1 cover photo, distinct from the page-2 hero. Only magazine-1/-3 read
   * it (their MagazineCover). Absent = fall back to `hero`, so v1 files and the
   * other templates keep their look — the cover only diverges once it's set.
   */
  cover?: { assetId: string | null; offsetX: number; offsetY: number; scale: number };
  assets: Record<string, Asset>;
  design: Design;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyDoc = (): Doc => ({
  schemaVersion: SCHEMA_VERSION,
  templateId: 'paper-1',
  meta: { categoryLabel: '', title: '', subtitle: '', author: '', affiliation: '', volume: '' },
  blocks: [{ id: uid(), type: 'paragraph', text: '' }],
  highlights: [''],
  references: [],
  hero: { assetId: null, offsetX: 0, offsetY: 0, scale: 1 },
  assets: {},
  design: {
    bodyCols: 3,
    bodyAlign: 'justify',
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