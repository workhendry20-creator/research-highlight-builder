import { emptyDoc, uid, type Doc } from './schema/document';

// Kept short on purpose: the default document is a single A4 page. Page 2
// appears on its own the moment the author writes past this.
const P = [
  `Topological photonic crystals guide light along their edges with a robustness ordinary waveguides cannot match. We report a silicon-on-insulator platform whose valley-Hall edge states carry telecom-band light around sharp corners with negligible back-scattering.`,
  `The device is a honeycomb lattice of triangular holes. Breaking the inversion symmetry of the unit cell opens a band gap and imprints opposite Berry curvature on the two valleys, so a gapless edge mode forms where two mirrored domains meet.`,
  `Across waveguides with up to ten sixty-degree bends the valley-Hall guide stays within one decibel over the full C-band, where conventional line-defect guides lose several decibels per bend — a practical building block for dense photonic circuits.`,
];

export function sampleDoc(): Doc {
  const d = emptyDoc();
  d.meta = {
    categoryLabel: 'Research Highlight · Photonics',
    title: 'Light that turns corners without looking back',
    subtitle: 'Valley-Hall edge states for robust on-chip photonic routing',
    author: 'A. Rahman, S. Tan & M. Yusof',
    affiliation: 'School of Physics, Universiti Sains Malaysia',
  };
  d.blocks = P.map((text) => ({ id: uid(), type: 'paragraph', text }));
  d.highlights = [
    'Valley-Hall edge modes route telecom light around sharp bends with < 1 dB loss.',
    'Topological protection suppresses back-scattering from fabrication disorder.',
    'Edge-mode lasing demonstrates active topological photonics on a silicon chip.',
  ];
  d.references = [
    {
      id: uid(),
      authors: 'Rahman, A. et al.',
      title: 'Robust valley-Hall routing at telecom wavelengths',
      journal: 'Nature Photonics',
      year: '2025',
      doi: '10.1038/s41566-025-00000-0',
    },
    {
      id: uid(),
      authors: 'Tan, S. & Yusof, M.',
      title: 'Edge-mode lasing in a topological photonic crystal',
      journal: 'Phys. Rev. Lett.',
      year: '2024',
      doi: '10.1103/PhysRevLett.000.000000',
    },
  ];
  return d;
}
