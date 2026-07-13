import { emptyDoc, uid, type Doc } from './schema/document';

const P = [
  `Topological photonic crystals guide light along their edges with a robustness that ordinary waveguides cannot match. In this highlight we report a silicon-on-insulator platform in which valley-Hall edge states carry telecom-band light around sharp corners with negligible back-scattering, opening a route to compact, defect-tolerant on-chip interconnects.`,
  `The device is patterned as a honeycomb lattice of triangular holes. Breaking the inversion symmetry of the unit cell opens a band gap and imprints opposite Berry curvature on the two valleys. Where two mirrored domains meet, a gapless edge mode appears inside the bulk gap and inherits the valley index, so light of a given valley is forbidden from scattering backward.`,
  `We measured transmission through waveguides containing up to ten sixty-degree bends. Conventional line-defect guides lose more than three decibels per bend at these radii; the valley-Hall guide stays within one decibel across the full C-band. Near-field scans confirm that the mode hugs the domain wall and reroutes cleanly around each corner.`,
  `Beyond passive routing, the same edge states can host nonlinear and active functions. By integrating the domain wall with an ion-implanted gain region we observed edge-mode lasing with a threshold comparable to conventional micro-ring sources, but with an emission pattern locked to the topological boundary rather than to a fabricated cavity.`,
  `These results position valley-Hall transport as a practical building block for the next generation of photonic integrated circuits, where dense routing and fabrication tolerance matter more than raw index contrast. Ongoing work extends the platform to reconfigurable domain walls defined electrically rather than lithographically.`,
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
