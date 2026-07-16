import { emptyDoc, uid, type Doc, type TemplateFamily, type TemplateId } from '../schema/document';
import { sampleDoc } from '../sample';

/**
 * Template registry. Two families (paper / magazine), each with several presets.
 * A preset is a self-contained Doc (content + design tokens + any placeholder
 * asset). `switchTemplate` loads one so the canvas fills instantly.
 */

export interface TemplateMeta {
  id: TemplateId;
  family: TemplateFamily;
  name: string;
  kind: string;
}

// ---- Shared placeholder photos (SVG data URLs, no external files) -----------

const svg = (inner: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">${inner}</svg>`,
  );

const stars = (pts: [number, number, number][]) =>
  pts
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="0.8"/>`)
    .join('');

/** Twilight mountaintop observatory. */
const PHOTO_OBSERVATORY = svg(
  `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1a3a"/><stop offset="0.45" stop-color="#5b2a63"/>
    <stop offset="0.72" stop-color="#c2603f"/><stop offset="1" stop-color="#f2a65a"/></linearGradient></defs>
   <rect width="1600" height="900" fill="url(#s)"/>
   ${stars([[180, 120, 2.4], [640, 150, 2], [1120, 130, 2.6], [1340, 90, 1.7], [1500, 180, 2]])}
   <polygon points="0,900 300,560 560,700 820,470 1040,640 1320,430 1600,660 1600,900" fill="#241033" opacity="0.9"/>
   <polygon points="0,900 240,660 520,780 900,560 1180,760 1600,600 1600,900" fill="#120720"/>
   <g transform="translate(1080 470)"><rect x="-8" y="42" width="120" height="60" fill="#0a0413"/>
   <path d="M -14 44 A 60 52 0 0 1 118 44 Z" fill="#1c0f2e"/>
   <rect x="34" y="-6" width="10" height="54" fill="#0a0413" transform="rotate(-24 39 20)"/></g>`,
);

/** Particle-collision tracks radiating from a bright vertex. */
const PHOTO_COLLIDER = svg(
  `<rect width="1600" height="900" fill="#04070f"/>
   ${stars([[200, 120, 1.4], [1400, 160, 1.6], [760, 90, 1.3], [1180, 720, 1.4]])}
   <g fill="none" stroke-width="3" opacity="0.9">
     <path d="M800 450 C 700 300, 500 260, 300 180" stroke="#22d3ee"/>
     <path d="M800 450 C 940 320, 1180 300, 1420 210" stroke="#38bdf8"/>
     <path d="M800 450 C 720 600, 560 720, 320 820" stroke="#818cf8"/>
     <path d="M800 450 C 900 640, 1120 740, 1360 830" stroke="#67e8f9"/>
     <path d="M800 450 C 800 300, 820 200, 840 90" stroke="#e0f2fe"/>
     <path d="M800 450 C 640 460, 420 470, 200 460" stroke="#22d3ee" opacity="0.6"/>
     <path d="M800 450 C 980 470, 1220 470, 1460 455" stroke="#38bdf8" opacity="0.6"/>
   </g>
   <circle cx="800" cy="450" r="46" fill="#22d3ee" opacity="0.25"/>
   <circle cx="800" cy="450" r="16" fill="#e0f2fe"/>`,
);

/** Black hole with a glowing accretion ring. */
const PHOTO_BLACKHOLE = svg(
  `<defs><radialGradient id="b" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#1a0f04"/><stop offset="1" stop-color="#03040a"/></radialGradient></defs>
   <rect width="1600" height="900" fill="url(#b)"/>
   ${stars([[160, 140, 1.6], [1440, 120, 1.8], [520, 720, 1.4], [1180, 760, 1.5], [900, 120, 1.3], [300, 420, 1.2]])}
   <g transform="translate(800 450)">
     <ellipse rx="330" ry="96" fill="none" stroke="#f59e0b" stroke-width="26" opacity="0.28"/>
     <ellipse rx="300" ry="82" fill="none" stroke="#fbbf24" stroke-width="14" opacity="0.55"/>
     <ellipse rx="272" ry="70" fill="none" stroke="#fde68a" stroke-width="6" opacity="0.9"/>
     <circle r="150" fill="#03040a"/>
     <circle r="150" fill="none" stroke="#fcd34d" stroke-width="3" opacity="0.5"/>
   </g>`,
);

const paras = (texts: string[]): Doc['blocks'] =>
  texts.map((text) => ({ id: uid(), type: 'paragraph' as const, text }));

// ---- Paper family (academic research highlight) ----------------------------

function makePaper1(): Doc {
  return { ...sampleDoc(), templateId: 'paper-1' };
}

function makePaper2(): Doc {
  const d = emptyDoc();
  d.templateId = 'paper-2';
  d.meta = {
    categoryLabel: 'Research Highlight · Condensed Matter',
    title: 'Superconductivity near room temperature in a hydride lattice',
    subtitle: 'A pressure-stabilised Im-3m phase carries current without resistance close to 294 K',
    author: 'N. Farid, L. Chandra & P. M. Wong',
    affiliation: 'School of Physics, Universiti Sains Malaysia',
  };
  d.design = {
    ...d.design,
    bodyCols: 4,
    colors: { hero: '#1e1b4b', accent: '#4338ca', accentSoft: '#e5e4fb', ink: '#111418' },
  };
  d.blocks = paras([
    'A superconductor expels magnetic fields and carries current with zero resistance, but until recently only far below room temperature. Compressed hydrogen-rich compounds change the picture: light hydrogen atoms vibrate fast, coupling strongly to electrons and driving pairing at unprecedented temperatures.',
    'Our sample is a rare-earth polyhydride squeezed to 180 gigapascals in a diamond anvil cell. X-ray diffraction confirms a body-centred cubic hydrogen cage, and a sharp resistance drop marks a transition at 294 kelvin — a degree below a warm room.',
    'The Meissner effect and the shift of the transition under an applied field together rule out artefacts, pointing to genuine phonon-mediated superconductivity. The remaining challenge is pressure: recovering the phase at ambient conditions would turn a laboratory marvel into a technology.',
  ]);
  d.highlights = [
    'Zero-resistance transition observed at 294 K under 180 GPa pressure.',
    'Body-centred cubic hydrogen cage confirmed by synchrotron diffraction.',
    'Field-dependent transition rules out non-superconducting artefacts.',
  ];
  d.references = [
    { id: uid(), authors: 'Farid, N. et al.', title: 'Near-ambient superconductivity in a rare-earth polyhydride', journal: 'Nature', year: '2025', doi: '10.1038/s41586-025-00000-0' },
  ];
  return d;
}

function makePaper3(): Doc {
  const d = emptyDoc();
  d.templateId = 'paper-3';
  d.meta = {
    categoryLabel: 'Research Highlight · Quantum Information',
    title: 'Second-long coherence for spin qubits in isotopically pure silicon',
    subtitle: 'Removing spinful nuclei extends memory times toward fault-tolerant thresholds',
    author: 'R. Iskandar & T. Nakamura',
    affiliation: 'School of Physics, Universiti Sains Malaysia',
  };
  d.design = {
    ...d.design,
    bodyCols: 2,
    bodyAlign: 'justify',
    colors: { hero: '#0b3b3a', accent: '#0f766e', accentSoft: '#d7f0ec', ink: '#111418' },
  };
  d.blocks = paras([
    'The spin of a single electron trapped in silicon is a natural qubit, but stray magnetic noise from surrounding atomic nuclei scrambles its phase within milliseconds. Purifying the crystal to the spin-zero isotope silicon-28 removes most of that noise at the source.',
    'In a 99.99 per cent enriched device cooled to twenty millikelvin, we measure a Hahn-echo coherence time exceeding one second — four orders of magnitude longer than in natural silicon, and comfortably above the error-correction threshold for surface codes.',
    'Because the qubit is defined lithographically in a material the semiconductor industry already masters, the result charts a manufacturable path from single spins to dense, error-corrected quantum processors.',
  ]);
  d.highlights = [
    'Hahn-echo coherence beyond one second at 20 mK.',
    'Isotopic purification to 99.99% silicon-28 suppresses nuclear-spin noise.',
    'Coherence clears the surface-code fault-tolerance threshold.',
  ];
  d.references = [
    { id: uid(), authors: 'Iskandar, R. & Nakamura, T.', title: 'Second-scale spin coherence in enriched silicon', journal: 'Phys. Rev. X', year: '2024', doi: '10.1103/PhysRevX.00.000000' },
  ];
  return d;
}

// ---- Magazine family (editorial spread) ------------------------------------

interface MagInput {
  id: TemplateId;
  photo: string;
  accent: string;
  accentSoft: string;
  categoryLabel: string;
  title: string;
  subtitle: string;
  author: string;
  affiliation: string;
  volume: string;
  location: string;
  photoCredit: string;
  pullQuote: string;
  pullQuoteBy: string;
  body: string[];
}

function makeMagazine(m: MagInput): Doc {
  const d = emptyDoc();
  const photoId = uid();
  d.templateId = m.id;
  d.meta = {
    masthead: 'KUANTA',
    categoryLabel: m.categoryLabel,
    title: m.title,
    subtitle: m.subtitle,
    author: m.author,
    affiliation: m.affiliation,
    volume: m.volume,
    location: m.location,
    photoCredit: m.photoCredit,
    pullQuote: m.pullQuote,
    pullQuoteBy: m.pullQuoteBy,
  };
  // Design defaults that the Design panel can then tune (columns/align/gutter/
  // body size/fonts/colors all feed the magazine CSS via CSS vars).
  d.design = {
    ...d.design,
    bodyCols: 2,
    gutter: 8,
    bodyAlign: 'justify',
    fontDisplay: 'Playfair Display', // serif elements (quote, lede, drop cap)
    sizes: { ...d.design.sizes, body: 10.5 },
    colors: { hero: '#0b1220', accent: m.accent, accentSoft: m.accentSoft, ink: '#14181f' },
  };
  d.hero = { assetId: photoId, offsetX: 0, offsetY: 0, scale: 1 };
  d.assets = { [photoId]: { src: m.photo, naturalWidth: 1600, naturalHeight: 900 } };
  d.blocks = paras(m.body);
  d.highlights = [];
  d.references = [];
  return d;
}

const makeMagazine1 = (): Doc =>
  makeMagazine({
    id: 'magazine-1',
    photo: PHOTO_OBSERVATORY,
    accent: '#e11d2e',
    accentSoft: '#fde7ea',
    categoryLabel: 'LAPORAN UTAMA',
    title: 'MENGURAI RAHASIA ALAM SEMESTA',
    subtitle:
      'Di puncak dingin empat ribu meter, sebuah cermin raksasa menangkap cahaya yang telah mengembara miliaran tahun sebelum sampai ke mata kita.',
    author: 'DR. ARIA PRATAMA',
    affiliation: 'KUANTA — Rubrik Astrofisika',
    volume: 'VOL. IX · NO.2 · MARET 2026',
    location: 'OBSERVATORIUM MAUNA · 4.200 MDPL',
    photoCredit: 'L. HAKIM',
    pullQuote:
      'Setiap foton yang jatuh ke cermin ini adalah kurir dari masa lalu—pesan yang dikirim jauh sebelum Bumi ada.',
    pullQuoteBy: '— DR. ARIA PRATAMA, FEB 2026',
    body: [
      'Suhu di puncak menyentuh minus dua belas ketika kubah raksasa itu perlahan terbuka. Di dalamnya, cermin sepanjang delapan meter menunggu—dipoles hingga kehalusan sepersejuta milimeter, cukup untuk menangkap kerlip cahaya yang telah menempuh perjalanan lebih tua daripada Bumi.',
      'Empat ribu dua ratus meter di atas permukaan laut, udara begitu tipis dan kering sehingga bintang tak lagi berkedip. Di sinilah para astronom memburu foton-foton purba: partikel cahaya yang berangkat dari galaksi jauh jauh sebelum Matahari kita menyala.',
      'Setiap malam jernih adalah jendela sempit menuju masa lampau. Semakin jauh objek yang diamati, semakin tua cahayanya—sehingga menatap ke ruang angkasa sesungguhnya berarti menatap ke belakang, menyusuri sejarah alam semesta hingga ke tepian pertamanya.',
      'Data yang mengalir dari detektor bukan gambar biasa, melainkan spektrum: pelangi yang terurai menjadi garis-garis terang dan gelap. Dari pola itu, fisikawan membaca komposisi, suhu, dan kecepatan benda langit yang bergerak menjauh seiring memuainya kosmos.',
      'Menjelang fajar astronomis, langit di ufuk timur mulai merekah keunguan. Kubah menutup pelan-pelan, menyimpan kembali keheningannya. Namun di dalam server dingin di kaki gunung, semesta yang baru saja terekam mulai diurai—satu foton, satu petunjuk, satu bab dari kisah yang dimulai empat belas miliar tahun lalu.',
    ],
  });

/** magazine-2 splits one photo across sheets 1–2, and its sheet 1 carries the
 *  quote + a highlights box in the foot, so unlike the other magazines it ships
 *  with highlights filled in. */
const makeMagazine2 = (): Doc => {
  const d = makeMagazine({
    id: 'magazine-2',
    photo: PHOTO_COLLIDER,
    accent: '#0891b2',
    accentSoft: '#cffafe',
    categoryLabel: 'SAINS GARIS DEPAN',
    title: 'TUMBUKAN DI JANTUNG MATERI',
    subtitle:
      'Di terowongan melingkar sepanjang dua puluh tujuh kilometer, proton dipacu nyaris secepat cahaya lalu diadu—demi menyingkap bata penyusun kenyataan.',
    author: 'DR. SINTA HALIM',
    affiliation: 'KUANTA — Rubrik Fisika Partikel',
    volume: 'VOL. IX · NO.3 · APRIL 2026',
    location: 'FASILITAS AKSELERATOR · TEROWONGAN 27 KM',
    photoCredit: 'B. NUGROHO',
    pullQuote:
      'Dalam kilatan sepersekian sepertriliun detik, energi memadat menjadi partikel yang belum pernah kita saksikan.',
    pullQuoteBy: '— DR. SINTA HALIM, MAR 2026',
    // Sized to the two columns beside the photo strip: the article closes on
    // sheet 1 so the spread stays two sheets — article + photo — as designed.
    body: [
      'Seratus meter di bawah tanah, dua berkas proton meluncur berlawanan arah di dalam pipa hampa yang lebih kosong daripada ruang antarplanet. Magnet superkonduktor sedingin minus dua ratus tujuh puluh satu derajat membelokkan lintasannya menjadi cincin sempurna.',
      'Ketika kedua berkas beradu, energi tumbukan sesaat memadat menjadi hujan partikel. Di sinilah teori diuji: setiap serpihan yang terlempar direkam oleh detektor setinggi gedung, lapis demi lapis, untuk merekonstruksi apa yang sesungguhnya terjadi.',
      'Sebagian besar tumbukan hanya mengulang hal yang sudah dikenal. Namun sekali dalam miliaran peristiwa, muncul pola langka—jejak partikel berat yang lenyap seketika, meninggalkan petunjuk tentang medan yang memberi massa pada seluruh materi.',
      'Menganalisisnya bukan pekerjaan satu malam. Perangkat lunak menyaring jutaan tumbukan per detik, membuang yang biasa, menyimpan yang menjanjikan. Dari lautan data itulah peta materi paling mendasar disusun ulang.',
    ],
  });
  // The photo strip leaves a narrow text box on sheet 1; left-aligned, since a
  // column that narrow plus justify is a river of spaces.
  d.design.bodyAlign = 'left';
  d.design.sizes = { ...d.design.sizes, title: 34, subtitle: 11 };
  d.highlights = [
    'Dua berkas proton diadu pada energi 13 TeV di dalam cincin 27 km.',
    'Detektor merekam jejak tumbukan lapis demi lapis, jutaan kali per detik.',
    'Pola langka satu banding miliaran menjadi petunjuk medan pemberi massa.',
  ];
  return d;
};

const makeMagazine3 = (): Doc =>
  makeMagazine({
    id: 'magazine-3',
    photo: PHOTO_BLACKHOLE,
    accent: '#d97706',
    accentSoft: '#fef0d9',
    categoryLabel: 'LAPORAN UTAMA',
    title: 'GEMA DARI LUBANG HITAM',
    subtitle:
      'Dua raksasa gelap berpilin lalu menyatu, mengguncang ruang-waktu—dan gelombangnya sampai ke Bumi sebagai bisikan sehalus seperseribu diameter proton.',
    author: 'DR. AGUS RIYANTO',
    affiliation: 'KUANTA — Rubrik Kosmologi',
    volume: 'VOL. IX · NO.4 · MEI 2026',
    location: 'DETEKTOR GELOMBANG GRAVITASI · LENGAN 4 KM',
    photoCredit: 'M. FAUZI',
    pullQuote:
      'Untuk pertama kalinya, manusia tidak menatap alam semesta—melainkan mendengarnya.',
    pullQuoteBy: '— DR. AGUS RIYANTO, APR 2026',
    body: [
      'Satu koma tiga miliar tahun lalu, di sudut jauh alam semesta, dua lubang hitam saling mengejar dalam tarian maut. Masing-masing sepuluh kali lebih berat dari Matahari, mereka berpilin makin cepat hingga akhirnya melebur dalam sepersekian detik.',
      'Peristiwa itu melepaskan energi lebih besar daripada seluruh cahaya bintang di kosmos digabungkan—namun tak sekeping pun berupa cahaya. Semuanya mengalir sebagai gelombang gravitasi: riak pada jalinan ruang-waktu itu sendiri.',
      'Gelombang itu mengembara selama lebih dari satu miliar tahun, meregang dan memampat setiap galaksi yang dilewatinya sedikit demi sedikit. Ketika akhirnya menyapu Bumi, ia menggeser cermin detektor sejauh seperseribu lebar sebuah proton.',
      'Menangkap pergeseran sekecil itu menuntut ketelitian yang nyaris mustahil: dua lengan laser sepanjang empat kilometer, terisolasi dari getaran lalu lintas, gempa, bahkan debur ombak di pantai yang jauh.',
      'Sinyalnya berlangsung kurang dari seperlima detik—sebuah dengung yang meninggi lalu senyap. Namun dalam dengung itu terekam kelahiran sebuah ilmu baru: astronomi yang mendengarkan, bukan sekadar menatap, denyut alam semesta.',
    ],
  });

// ---- Registry --------------------------------------------------------------

export const TEMPLATES: (TemplateMeta & { make: () => Doc })[] = [
  { id: 'paper-1', family: 'paper', name: 'Paper 1', kind: 'Academic Journal', make: makePaper1 },
  { id: 'paper-2', family: 'paper', name: 'Paper 2', kind: 'Physics Letter', make: makePaper2 },
  { id: 'paper-3', family: 'paper', name: 'Paper 3', kind: 'Quantum Monograph', make: makePaper3 },
  { id: 'magazine-1', family: 'magazine', name: 'Magazine 1', kind: 'Modern Editorial', make: makeMagazine1 },
  { id: 'magazine-2', family: 'magazine', name: 'Magazine 2', kind: 'Particle Feature', make: makeMagazine2 },
  { id: 'magazine-3', family: 'magazine', name: 'Magazine 3', kind: 'Cosmos Spread', make: makeMagazine3 },
];

export const TEMPLATE_META: TemplateMeta[] = TEMPLATES.map(({ id, family, name, kind }) => ({
  id,
  family,
  name,
  kind,
}));

/** Fresh preset Doc for a template id (fresh so ids/assets aren't shared). */
export function presetFor(id: TemplateId): Doc {
  return (TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]).make();
}
