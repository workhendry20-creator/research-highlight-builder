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

// Tall fold variant (1200×2400) for gallery-2, whose fold runs vertically down
// the centre of the spread — the two halves are the left/right of a portrait.
const foldPhotoV = (a: string, b: string): string =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="2400">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>` +
      `<rect width="1200" height="2400" fill="url(#g)"/>` +
      `<g stroke="#fff" stroke-width="7" fill="none" opacity="0.65">` +
      `<circle cx="600" cy="1200" r="150"/><path d="M600 200 V2200"/></g></svg>`,
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

// ---- gallery-2 placeholder photos -----------------------------------------
const G2_FOLD = foldPhotoV('#0b1220', '#2563eb');
const G2_A = photo('#0f766e', '#2dd4bf', '<circle r="120" fill="none" stroke="#fff" stroke-width="12" opacity="0.85"/><circle r="34"/>');
const G2_B = photo('#7c2d12', '#f59e0b', '<rect x="-150" y="-100" width="300" height="200" rx="16" opacity="0.85"/>');
const G2_C = photo('#1e3a8a', '#38bdf8', '<path d="M-200 120 L0 -180 L200 120 Z" opacity="0.8"/>');
const G2_D = photo('#4c1d95', '#a855f7', '<circle cx="-100" r="66"/><circle cx="100" r="66"/><path d="M-100 0 H100" stroke="#fff" stroke-width="10"/>');
const G2_E = photo('#134e4a', '#22d3ee', '<rect x="-160" y="-8" width="320" height="16" opacity="0.7"/><circle r="60"/>');
const G2_F = photo('#831843', '#fb7185', '<circle r="130" fill="none" stroke="#fff" stroke-width="10" opacity="0.8"/><path d="M-90 -90 L90 90" stroke="#fff" stroke-width="10"/>');

/**
 * gallery-2 — a second photo spread. The fold image runs VERTICALLY down the
 * centre of the open spread (right column of page 1 → left column of page 2),
 * flanked by three tiles per page and a pair of text cards. Seven photos in all.
 * Ships a dark sheet to show off the auto-contrast text.
 */
export function makeGallery2(): Doc {
  const d = emptyDoc();
  d.templateId = 'gallery-2';
  d.meta = {
    ...d.meta,
    masthead: 'FIELD NOTES',
    title: 'LIGHT & MATTER',
    categoryLabel: 'USM School of Physics',
  };
  d.design = {
    ...d.design,
    bodyAlign: 'left',
    fontDisplay: 'Source Sans 3',
    colors: { hero: '#0f172a', accent: '#f8fafc', accentSoft: '#1e293b', ink: '#f8fafc' },
    paperBg: '#0e1116',
    margin: 12,
  };

  const ids = [uid(), uid(), uid(), uid(), uid(), uid(), uid()];
  d.assets = {
    [ids[0]]: { src: G2_FOLD, naturalWidth: 1200, naturalHeight: 2400 },
    [ids[1]]: { src: G2_A, naturalWidth: 1200, naturalHeight: 900 },
    [ids[2]]: { src: G2_B, naturalWidth: 1200, naturalHeight: 900 },
    [ids[3]]: { src: G2_C, naturalWidth: 1200, naturalHeight: 900 },
    [ids[4]]: { src: G2_D, naturalWidth: 1200, naturalHeight: 900 },
    [ids[5]]: { src: G2_E, naturalWidth: 1200, naturalHeight: 900 },
    [ids[6]]: { src: G2_F, naturalWidth: 1200, naturalHeight: 900 },
  };

  d.blocks = [
    // fig[0] is the vertical fold; the rest fill the flanking tiles in order.
    fig(ids[0], '**Down the centre**\nA single frame split by the fold, joining both pages.'),
    fig(ids[1], '**Ring resonator**\nLight circling a micro-cavity thousands of times.'),
    fig(ids[2], '**The sample**\nA thin film mounted for spectroscopy.'),
    fig(ids[3], '**Beam path**\nMirrors folding the optical table into inches.'),
    fig(ids[4], '**Collaboration**\nStudent and mentor at the alignment stage.'),
    fig(ids[5], '**Interference**\nFringes counted to nanometre precision.'),
    fig(ids[6], '**First light**\nThe moment the detector registers a signal.'),
    // Cards (4):
    card('**Photonics on a chip**\nGuiding light through engineered structures smaller than a hair.'),
    card('**Why it matters**\nFaster sensors, quantum links, and greener computing.'),
    card('**Built at USM**\nInstruments assembled and tuned by the group in-house.'),
    card('**What comes next**\nScaling single devices into full photonic circuits.'),
  ];

  d.highlights = [];
  d.references = [];
  d.hero = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };
  return d;
}

// ---- gallery-3 placeholder photos -----------------------------------------
const G3_FOLD = foldPhoto('#134e4a', '#f59e0b');
const G3_A = photo('#0c4a6e', '#38bdf8', '<circle r="120" fill="none" stroke="#fff" stroke-width="12" opacity="0.85"/><circle r="34"/>');
const G3_B = photo('#78350f', '#fbbf24', '<rect x="-150" y="-110" width="300" height="220" rx="16" opacity="0.85"/>');
const G3_C = photo('#312e81', '#818cf8', '<path d="M-200 130 L0 -190 L200 130 Z" opacity="0.8"/>');
const G3_D = photo('#064e3b', '#34d399', '<rect x="-170" y="-10" width="340" height="20" opacity="0.7"/><circle r="64"/>');
const G3_E = photo('#7f1d1d', '#f87171', '<circle cx="-95" r="62"/><circle cx="95" r="62"/><path d="M-95 0 H95" stroke="#fff" stroke-width="10"/>');
const G3_F = photo('#155e75', '#22d3ee', '<circle r="130" fill="none" stroke="#fff" stroke-width="10" opacity="0.8"/><path d="M-90 -90 L90 90" stroke="#fff" stroke-width="10"/>');
const G3_G = photo('#581c87', '#c084fc', '<circle r="70"/><rect x="-260" y="-6" width="520" height="12" opacity="0.55"/>');

/**
 * gallery-3 — a third photo spread. The fold image is a horizontal BAND across
 * the middle of the open spread (full width of page 1 → full width of page 2),
 * with a mosaic of tiles above and below on each page and four text cards. Eight
 * photos in all. Ships a warm off-white sheet.
 */
export function makeGallery3(): Doc {
  const d = emptyDoc();
  d.templateId = 'gallery-3';
  d.meta = {
    ...d.meta,
    masthead: 'THE LAB',
    title: 'IN FOCUS',
    categoryLabel: 'USM School of Physics',
  };
  d.design = {
    ...d.design,
    bodyAlign: 'left',
    fontDisplay: 'Source Sans 3',
    colors: { hero: '#0f172a', accent: '#111418', accentSoft: '#efe9df', ink: '#1c1917' },
    paperBg: '#f7f4ee',
    margin: 12,
  };

  const ids = [uid(), uid(), uid(), uid(), uid(), uid(), uid(), uid()];
  const dims = (src: string, w: number, h: number) => ({ src, naturalWidth: w, naturalHeight: h });
  d.assets = {
    [ids[0]]: dims(G3_FOLD, 2400, 900),
    [ids[1]]: dims(G3_A, 1200, 900),
    [ids[2]]: dims(G3_B, 1200, 900),
    [ids[3]]: dims(G3_C, 1200, 900),
    [ids[4]]: dims(G3_D, 1200, 900),
    [ids[5]]: dims(G3_E, 1200, 900),
    [ids[6]]: dims(G3_F, 1200, 900),
    [ids[7]]: dims(G3_G, 1200, 900),
  };

  d.blocks = [
    // fig[0] is the horizontal fold band; the rest fill the mosaic tiles in order.
    fig(ids[0], '**Across the spread**\nOne wide frame bridging the two pages at the fold.'),
    fig(ids[1], '**Cavity mode**\nLight trapped between two mirrors.'),
    fig(ids[2], '**Thin film**\nThe sample under the microscope.'),
    fig(ids[3], '**Alignment**\nSteering the beam onto the detector.'),
    fig(ids[4], '**Waveguide**\nGuiding light along an engineered edge.'),
    fig(ids[5], '**The team**\nStudent and supervisor at the bench.'),
    fig(ids[6], '**Diffraction**\nA pattern read for structure.'),
    fig(ids[7], '**Emission**\nThe first measured signal.'),
    // Cards (4):
    card('**Light on a chip**\nEngineered structures route photons where electronics cannot follow.'),
    card('**Why it matters**\nSharper sensing, quantum links, lower-power computing.'),
    card('**Made at USM**\nDesigned, fabricated, and measured by the group in-house.'),
    card('**Next steps**\nFrom single devices toward complete photonic circuits.'),
  ];

  d.highlights = [];
  d.references = [];
  d.hero = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };
  return d;
}

// ---- gallery-4 placeholder photos (fewer photos, more text) ----------------
const G4_FOLD = foldPhoto('#1e3a8a', '#0ea5e9');
const G4_A = photo('#0f766e', '#2dd4bf', '<circle r="120" fill="none" stroke="#fff" stroke-width="12" opacity="0.85"/><circle r="34"/>');
const G4_B = photo('#7c2d12', '#f59e0b', '<rect x="-150" y="-100" width="300" height="200" rx="16" opacity="0.85"/>');
const G4_C = photo('#4c1d95', '#a855f7', '<circle cx="-100" r="66"/><circle cx="100" r="66"/><path d="M-100 0 H100" stroke="#fff" stroke-width="10"/>');
const G4_D = photo('#134e4a', '#22d3ee', '<path d="M-200 120 L0 -180 L200 120 Z" opacity="0.8"/>');

/**
 * gallery-4 — a text-forward spread. Only FIVE photos: one fold image (a tall
 * block on the inner edge, crossing the fold) plus four small tiles, so the rest
 * of the spread is given to SIX text cards with longer copy. A quieter, editorial
 * layout for when the story carries more than the pictures.
 */
export function makeGallery4(): Doc {
  const d = emptyDoc();
  d.templateId = 'gallery-4';
  d.meta = {
    ...d.meta,
    masthead: 'LONG READ',
    title: 'THE QUIET WORK',
    categoryLabel: 'USM School of Physics',
  };
  d.design = {
    ...d.design,
    bodyAlign: 'left',
    fontDisplay: 'Source Sans 3',
    colors: { hero: '#0f172a', accent: '#1d4ed8', accentSoft: '#e2e8f0', ink: '#0f172a' },
    paperBg: '#eef2f7',
    margin: 12,
  };

  const ids = [uid(), uid(), uid(), uid(), uid()];
  const dims = (src: string, w: number, h: number) => ({ src, naturalWidth: w, naturalHeight: h });
  d.assets = {
    [ids[0]]: dims(G4_FOLD, 2400, 900),
    [ids[1]]: dims(G4_A, 1200, 900),
    [ids[2]]: dims(G4_B, 1200, 900),
    [ids[3]]: dims(G4_C, 1200, 900),
    [ids[4]]: dims(G4_D, 1200, 900),
  };

  d.blocks = [
    // fig[0] is the fold; fig[1..4] are the four small tiles.
    fig(ids[0], '**Between the pages**\nOne image carried across the fold of the spread.'),
    fig(ids[1], '**Micro-cavity**\nLight circling a ring thousands of times.'),
    fig(ids[2], '**The sample**\nA thin film mounted for spectroscopy.'),
    fig(ids[3], '**The group**\nStudent and supervisor at the bench.'),
    fig(ids[4], '**Detector**\nWhere the signal is finally read.'),
    // Six text cards, longer copy — this template is text-forward.
    card('**A patient discipline**\nMost of the work is invisible: aligning mirrors to a fraction of a wavelength, chasing a drift of a few nanometres, repeating a measurement until the noise gives way to a signal you can trust.'),
    card('**Light as a tool**\nBy shaping how light moves through engineered structures, the group builds sensors and links that electronics alone cannot match — smaller, faster, and far more sensitive.'),
    card('**On a chip**\nWhat once filled an optical table is being pressed onto silicon a few millimetres wide, where photons are routed along engineered edges instead of copper wires.'),
    card('**Why it matters**\nThe payoff reaches from medical imaging to secure quantum communication and low-power computing — fields where a better way to move light changes what is possible.'),
    card('**Made at USM**\nEvery instrument here is designed, fabricated, and tuned in-house, giving students end-to-end command of the experiment rather than a black box.'),
    card('**What comes next**\nThe near-term goal is to join single devices into complete photonic circuits — many functions on one chip, working together at the speed of light.'),
  ];

  d.highlights = [];
  d.references = [];
  d.hero = { assetId: null, offsetX: 0, offsetY: 0, scale: 1 };
  return d;
}
