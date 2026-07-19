import { emptyDoc, uid, type Doc } from '../schema/document';

/**
 * Gallery family. One template, TWO A4 pages read as an open spread. It is a
 * fixed photo collage, not a text flow: the CSS grid owns every slot and the
 * doc's blocks fill them in order — figures into the image slots, paragraphs
 * into the text-card slots.
 *
 * The second figure (IMAGES 2) is the FOLD image: it sits top-right on page 1
 * and continues top-left on page 2, so the two halves meet at the fold like a
 * magazine spread (GalleryPage paints each half from the one asset).
 *
 * Captions/cards carry "**Title**\nDescription" — line 1 renders as a bold
 * title, the rest as the description.
 */

// ---- Placeholder photos (inline SVG data URLs — no external files) ----------

const photo = (a: string, b: string, glyph: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>` +
      `<rect width="1200" height="900" fill="url(#g)"/>` +
      `<g fill="#ffffff" opacity="0.9" transform="translate(600 450)">${glyph}</g></svg>`,
  );

// Fold image is deliberately wide (2400×900) so its two halves fill the two
// facing cells without stretching.
const foldPhoto = (a: string, b: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="900">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>` +
      `<rect width="2400" height="900" fill="url(#g)"/>` +
      `<g stroke="#fff" stroke-width="6" fill="none" opacity="0.7">` +
      `<circle cx="1200" cy="450" r="120"/><path d="M400 450 H2000"/></g></svg>`,
  );

const PH_LASER = photo('#1e293b', '#0891b2', '<circle r="70"/><rect x="-260" y="-6" width="520" height="12" opacity="0.55"/>');
const PH_SAMPLE = photo('#7c2d12', '#ea580c', '<rect x="-120" y="-160" width="240" height="320" rx="18" opacity="0.85"/>');
const PH_TEAM = photo('#0f172a', '#334155', '<circle cx="-90" r="60"/><circle cx="90" r="60"/><rect x="-190" y="70" width="380" height="140" rx="70" opacity="0.7"/>');
const PH_OPTICS = photo('#134e4a', '#14b8a6', '<circle r="130" fill="none" stroke="#fff" stroke-width="12" opacity="0.8"/><circle r="40"/>');
const PH_FOLD = foldPhoto('#312e81', '#6d28d9');

const fig = (assetId: string, caption: string): Doc['blocks'][number] => ({
  id: uid(),
  type: 'figure',
  assetId,
  caption,
  span: 1,
});

const card = (text: string): Doc['blocks'][number] => ({ id: uid(), type: 'paragraph', text });

/** The single gallery template: a two-page photo spread. */
export function makeGallery1(): Doc {
  const d = emptyDoc();
  d.templateId = 'gallery-1';
  d.meta = {
    ...d.meta,
    masthead: 'PHYSICS GALLERY',
    title: 'INSIDE THE LAB',
    categoryLabel: 'USM School of Physics',
  };
  d.design = {
    ...d.design,
    // Narrow collage columns → left, not the global justify default.
    bodyAlign: 'left',
    fontDisplay: 'Source Sans 3',
    colors: { hero: '#0f172a', accent: '#111418', accentSoft: '#f1f5f9', ink: '#111418' },
    margin: 12,
  };

  // Five images: fig[1] (PH_FOLD) is the fold-spanning one (IMAGES 2).
  const a1 = uid();
  const a2 = uid();
  const a3 = uid();
  const a4 = uid();
  const a5 = uid();
  d.assets = {
    [a1]: { src: PH_LASER, naturalWidth: 1200, naturalHeight: 900 },
    [a2]: { src: PH_FOLD, naturalWidth: 2400, naturalHeight: 900 },
    [a3]: { src: PH_SAMPLE, naturalWidth: 1200, naturalHeight: 900 },
    [a4]: { src: PH_OPTICS, naturalWidth: 1200, naturalHeight: 900 },
    [a5]: { src: PH_TEAM, naturalWidth: 1200, naturalHeight: 900 },
  };

  d.blocks = [
    fig(a1, '**Aligning the beam**\nA physicist tunes a laser through a profiler and precision stage.'),
    fig(a2, '**Across the fold**\nOne panorama of the optics hall bridging both pages.'),
    fig(a3, '**The device**\nA silicon chip carrying valley-Hall edge waveguides.'),
    fig(a4, '**Optical bench**\nMirrors and lenses steer the beam across the interferometer.'),
    fig(a5, '**The inventors**\nThe PhD student and supervisor behind the award-winning work.'),
    // Page 1 cards (2):
    card('**Cost-effective violet lasing**\nZinc-oxide nanorods act as the active medium for random laser emission near 405 nm.'),
    card('**Toward integrated optics**\nPotential use in bio-imaging, anti-counterfeit optics, and dense photonic circuits.'),
    // Page 2 cards (3):
    card('**Gold Medal, iCAN 2025**\nRecognised at the International Invention Innovation Competition in Canada.'),
    card('**Scientific creativity**\nThe project pairs sustainable materials with competitive laser technology.'),
    card('**Global impact**\nUSM research inspiring young generations to explore the frontiers of science.'),
  ];

  d.highlights = [];
  d.references = [];
  d.hero = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };
  return d;
}
