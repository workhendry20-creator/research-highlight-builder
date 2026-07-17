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

/** Diamond-anvil cell squeezing a hydrogen cage — paper-2's hero. */
const PHOTO_LATTICE = svg(
  `<defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0f1030"/><stop offset="1" stop-color="#2b1e5c"/></linearGradient></defs>
   <rect width="1600" height="900" fill="url(#l)"/>
   <g stroke="#8b9cf7" stroke-width="2" opacity="0.45">
     ${[0, 1, 2, 3, 4]
       .flatMap((r) =>
         [0, 1, 2, 3, 4, 5, 6, 7].map((c) => {
           const x = 220 + c * 165 + (r % 2) * 82;
           const y = 150 + r * 150;
           return `<line x1="${x}" y1="${y}" x2="${x + 165}" y2="${y}"/><line x1="${x}" y1="${y}" x2="${x + 82}" y2="${y + 150}"/>`;
         }),
       )
       .join('')}
   </g>
   <g fill="#c7d2fe">
     ${[0, 1, 2, 3, 4]
       .flatMap((r) =>
         [0, 1, 2, 3, 4, 5, 6, 7].map((c) => {
           const x = 220 + c * 165 + (r % 2) * 82;
           const y = 150 + r * 150;
           return `<circle cx="${x}" cy="${y}" r="9"/>`;
         }),
       )
       .join('')}
   </g>
   <g transform="translate(800 450)">
     <polygon points="-300,-420 300,-420 90,-70 -90,-70" fill="#e0e7ff" opacity="0.16"/>
     <polygon points="-300,420 300,420 90,70 -90,70" fill="#e0e7ff" opacity="0.16"/>
     <circle r="86" fill="#fbbf24" opacity="0.22"/>
     <circle r="34" fill="#fde68a"/>
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
  const photoId = uid();
  d.templateId = 'paper-2';
  d.meta = {
    categoryLabel: 'Research Highlight · Condensed Matter',
    title: 'Superconductivity near room temperature in a hydride lattice',
    subtitle: 'A pressure-stabilised Im-3m phase carries current without resistance close to 294 K',
    author: 'N. Farid, L. Chandra & P. M. Wong',
    affiliation: 'School of Physics, Universiti Sains Malaysia',
    masthead: 'School of Physics',
    heroCaption: 'The hydrogen cage at 180 GPa, resolved by synchrotron diffraction.',
  };
  d.design = {
    ...d.design,
    // 3 body columns + the highlights rail = the 4-column grid the sheet-1 split
    // is drawn against: header on 1–2, hero on 3–4.
    bodyCols: 3,
    // A 43mm column plus justify is a river of spaces.
    bodyAlign: 'left',
    sidebar: true,
    highlightsPlacement: 'page1',
    margin: 12,
    heroHeight: 112,
    // The header is two columns (~90mm), not the full sheet: 30pt puts a word
    // like "Superconductivity" wider than the measure, and Chrome won't
    // hyphenate that one, so it sails under the hero.
    sizes: { ...d.design.sizes, title: 24, subtitle: 11 },
    colors: { hero: '#1e1b4b', accent: '#4338ca', accentSoft: '#e5e4fb', ink: '#111418' },
    barColor: '#111418',
    barTagColor: '#bfbfbf',
    barTagInk: '#111418',
  };
  d.hero = { assetId: photoId, offsetX: 0, offsetY: 0, scale: 1 };
  d.assets = { [photoId]: { src: PHOTO_LATTICE, naturalWidth: 1600, naturalHeight: 900 } };
  d.blocks = paras([
    'A superconductor expels magnetic fields and carries current with zero resistance, but until recently only far below room temperature. Compressed hydrogen-rich compounds change the picture: light hydrogen atoms vibrate fast, coupling strongly to electrons and driving pairing at unprecedented temperatures.',
    'Our sample is a rare-earth polyhydride squeezed to 180 gigapascals in a diamond anvil cell. X-ray diffraction confirms a body-centred cubic hydrogen cage, and a sharp resistance drop marks a transition at 294 kelvin — a degree below a warm room.',
    'The Meissner effect and the shift of the transition under an applied field together rule out artefacts, pointing to genuine phonon-mediated superconductivity. The remaining challenge is pressure: recovering the phase at ambient conditions would turn a laboratory marvel into a technology.',
    'Pressure is generated between two brilliant-cut diamonds whose tips are polished to a flat some thirty micrometres across. The sample sits in a rhenium gasket no thicker than a sheet of paper, together with a ruby chip whose fluorescence reads out the pressure to within a few gigapascals.',
    'Measuring resistance through that assembly is its own craft. Four electrodes are sputtered directly onto the diamond culet and insulated from the gasket, so the current path runs through the sample and nothing else. A false contact would mimic exactly the signal the experiment is looking for, which is why every run is repeated on a fresh loading.',
    'What makes the hydride family compelling is that the pairing needs no exotic mechanism. Hydrogen is the lightest element, its lattice vibrations are the fastest available, and conventional electron-phonon theory predicts the transition temperatures we observe without adjustment. The physics is textbook; the pressure is not.',
    'Densities of states computed for the Im-3m phase place the Fermi level on a broad hydrogen-derived peak, and the calculated coupling constant reproduces the measured onset within a few kelvin. That agreement is the strongest argument that the cage, and not some surface artefact, carries the current.',
    'Ambient-pressure recovery remains the open problem. Chemical pre-compression — substituting a larger rare-earth ion to squeeze the hydrogen sublattice without an anvil — is the most promising route, and the one the group is now pursuing.',
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
  const photoId = uid();
  d.templateId = 'paper-3';
  d.meta = {
    categoryLabel: 'Research Highlight · Quantum Information',
    title: 'Second-long coherence for spin qubits in isotopically pure silicon',
    subtitle: 'Removing spinful nuclei extends memory times toward fault-tolerant thresholds',
    author: 'R. Iskandar & T. Nakamura',
    affiliation: 'School of Physics, Universiti Sains Malaysia',
    masthead: 'Quantum Monograph',
  };
  d.design = {
    ...d.design,
    // 3 body columns + the highlights rail on sheet 1; sheet 2 spends the rail
    // column on text, which is the 4 columns the spread is drawn against.
    bodyCols: 3,
    // A 43mm column plus justify is a river of spaces.
    bodyAlign: 'left',
    sidebar: true,
    highlightsPlacement: 'page1',
    margin: 12,
    // Band height, not a full hero: it only caps the top of sheets 1 and 2.
    heroHeight: 52,
    sizes: { ...d.design.sizes, title: 26, subtitle: 11 },
    colors: { hero: '#0b3b3a', accent: '#0f766e', accentSoft: '#d7f0ec', ink: '#111418' },
    barColor: '#111418',
    barTagColor: '#bfbfbf',
    barTagInk: '#111418',
  };
  const figId = uid();
  d.hero = { assetId: photoId, offsetX: 0, offsetY: 0, scale: 1 };
  d.assets = {
    [photoId]: { src: PHOTO_COLLIDER, naturalWidth: 1600, naturalHeight: 900 },
    [figId]: { src: PHOTO_LATTICE, naturalWidth: 1600, naturalHeight: 900 },
  };
  d.blocks = paras([
    'The spin of a single electron trapped in silicon is a natural qubit, but stray magnetic noise from surrounding atomic nuclei scrambles its phase within milliseconds. Purifying the crystal to the spin-zero isotope silicon-28 removes most of that noise at the source.',
    'In a 99.99 per cent enriched device cooled to twenty millikelvin, we measure a Hahn-echo coherence time exceeding one second — four orders of magnitude longer than in natural silicon, and comfortably above the error-correction threshold for surface codes.',
    'Because the qubit is defined lithographically in a material the semiconductor industry already masters, the result charts a manufacturable path from single spins to dense, error-corrected quantum processors.',
    'Natural silicon is a poor host for a quantum memory. About five per cent of its atoms are silicon-29, the one stable isotope carrying nuclear spin, and each of those spins generates a small magnetic field that wanders as its neighbours flip. An electron sitting in that bath sees a field that drifts unpredictably, and a qubit whose Larmor frequency drifts is a qubit losing its phase.',
    'Isotopic enrichment attacks the problem at its root rather than compensating for it. Silicon tetrafluoride is run through a centrifuge cascade until the silicon-29 fraction falls below one part in ten thousand, then reduced to silane and grown into an epitaxial layer. What remains is a crystal that is, magnetically speaking, almost empty space.',
    'The qubit itself is a single electron confined under an aluminium gate about forty nanometres across. A micromagnet beside it sets a field gradient, so a microwave burst delivered down a nearby line rotates the spin without moving the electron. Readout is by spin-dependent tunnelling: a spin-up electron can leave to a reservoir, a spin-down one cannot, and the resulting charge jump is sensed by a neighbouring dot.',
    'Coherence is measured with a Hahn echo, the same trick nuclear magnetic resonance has used for seventy years. A pulse tips the spin into the plane, a second pulse halfway through reverses its accumulated phase, and whatever slow noise the spin saw cancels out. What survives is the noise that changed within the sequence — and in enriched silicon there is remarkably little of it.',
    'The decay we measure is close to exponential, which is itself informative. Nuclear-spin baths produce a distinctive non-exponential shape; its absence says the remaining silicon-29 is no longer the limit. What is left looks like charge noise from the oxide interface, a defect that better materials growth can attack.',
    'One second of coherence is not merely a large number. Surface-code error correction demands that a qubit hold its state for many thousands of gate operations, and a two-qubit gate here takes tens of nanoseconds. The ratio, not the absolute time, is what clears the threshold — and it clears it with room to spare.',
    'Scaling is where spin qubits earn their claim. A transmon is millimetres across; this device is smaller than a modern transistor was a decade ago, and it is built from aluminium, oxide and silicon on a standard 300mm line. The gap between a laboratory device and a foundry process is narrower here than for any competing modality.',
    'The obstacles that remain are prosaic rather than fundamental. Each qubit currently needs its own microwave line, and a million of them cannot each have a coaxial cable to a dilution refrigerator. Cryogenic control electronics, multiplexed readout and shared-control architectures are all being pursued, and none of them requires new physics.',
    'What the second-long measurement really buys is time to be inefficient. Error correction spends coherence to buy reliability, and a long-lived qubit can afford a control stack that is merely good rather than perfect — which is the difference between a demonstration and a machine.',
  ]);
  // A bleeding figure anchored partway through the article — it rides the flow
  // like any other, and lands wherever the text puts it.
  d.blocks.splice(6, 0, {
    id: figId,
    type: 'figure',
    assetId: figId,
    caption: 'The enriched silicon-28 lattice: almost no nuclear spin left to dephase the qubit.',
    span: 'bleed',
    align: 'left',
  });
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
