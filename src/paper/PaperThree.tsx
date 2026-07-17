import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { grid } from '../lib/geometry';
import { bandPhoto, bandBgRecto, bandBgVerso } from '../lib/paper3';
import { Sidebar } from './Sidebar';
import { TagBar } from './TagBar';
import { Flow } from './Flow';

const photoOf = (doc: Doc) => (doc.hero.assetId ? doc.assets[doc.hero.assetId] : null);
const arOf = (doc: Doc) => {
  const p = photoOf(doc);
  return p ? p.naturalWidth / p.naturalHeight : 16 / 9;
};

/** The rule and the hero band share the top of every sheet that has a band.
 *  `verso` mirrors them: band left, rule right. */
function BandRow({ doc, verso }: { doc: Doc; verso: boolean }) {
  const photo = photoOf(doc);
  const p = bandPhoto(arOf(doc), doc.design.heroHeight);
  const band = (
    <div
      className="p3-band"
      style={photo ? { backgroundImage: `url("${photo.src}")`, ...(verso ? bandBgVerso(p) : bandBgRecto(p)) } : undefined}
    />
  );
  const rule = (
    <div className="p3-rule">
      <TagBar doc={doc} flip={verso} />
    </div>
  );
  return (
    <div className={`p3-top${verso ? ' p3-top--verso' : ''}`}>
      {verso ? band : rule}
      {verso ? rule : band}
    </div>
  );
}

interface PageProps {
  doc: Doc;
  vars: CSSProperties;
  pieces: Piece[];
}

/** Sheet 1 — recto: rule left, band right, header, body + rail, folio left. */
export function PaperThreePage1({ doc, vars, pieces }: PageProps) {
  const { meta, design } = doc;
  const { rail } = grid(design);

  return (
    <div className="page page--p3 page--recto" style={vars}>
      <BandRow doc={doc} verso={false} />
      <header className="header p3-head">
        <p className="eyebrow">{meta.categoryLabel}</p>
        <h1 className="title">{meta.title}</h1>
        {meta.subtitle && <p className="subtitle">{meta.subtitle}</p>}
        <p className="byline">
          {meta.author}
          {meta.affiliation && <span className="affiliation"> · {meta.affiliation}</span>}
        </p>
      </header>
      <div className="body-row">
        <div className="body-cols body-cols--p1">
          <Flow pieces={pieces} doc={doc} />
        </div>
        {rail && <Sidebar doc={doc} />}
      </div>
      <div className="page-footer">1</div>
    </div>
  );
}

/** Sheet 2 — verso: the hero band continues from the fold, no header. */
export function PaperThreePage2({ doc, vars, pieces }: PageProps) {
  const { railEvery } = grid(doc.design);
  return (
    <div className="page page--p3 page--verso" style={vars}>
      <BandRow doc={doc} verso />
      <div className="body-row">
        <div className="body-cols body-cols--p2 p3-cols--band">
          <Flow pieces={pieces} doc={doc} />
        </div>
        {railEvery && <Sidebar doc={doc} />}
      </div>
      <div className="page-footer">2</div>
    </div>
  );
}

/** Sheets 3+ — the photo is spent on the fold, so these keep sheet 2's
 *  orientation but drop the band and reclaim its height for text. */
export function PaperThreeCont({ doc, vars, pieces, pageNo }: PageProps & { pageNo: number }) {
  const { railEvery } = grid(doc.design);
  return (
    <div className="page page--p3 page--verso" style={vars}>
      <div className="body-row">
        <div className="body-cols body-cols--p2">
          <Flow pieces={pieces} doc={doc} />
        </div>
        {railEvery && <Sidebar doc={doc} />}
      </div>
      <div className="page-footer">{pageNo}</div>
    </div>
  );
}
