import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { splitPhoto, stripBg, photoPageBg } from '../lib/magSplit';
import { Flow } from './Flow';
import { MagSplitHead } from './MagSplitHead';

const photoOf = (doc: Doc) => (doc.hero.assetId ? doc.assets[doc.hero.assetId] : null);
const arOf = (doc: Doc) => {
  const p = photoOf(doc);
  return p ? p.naturalWidth / p.naturalHeight : 16 / 9;
};

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pieces: Piece[];
}

/** magazine-2 sheet 1: the article (band, title, columns, quote, highlights) with
 *  the left slice of the hero photo bleeding down the right edge. The rest of the
 *  photo continues on sheet 2 — see MagPhotoPage. */
export function MagSplitCover({ doc, vars, pieces }: Props) {
  const photo = photoOf(doc);
  const p = splitPhoto(arOf(doc));

  return (
    <div className="page mag2-page" style={vars}>
      <div className="mag2-inner">
        <MagSplitHead doc={doc} />
        {/* The pull-quote + highlights ride the flow's tail (MAG2_ASIDE_ID), so
            they close column 2 instead of being a block under both columns. */}
        <div className="mag2-cols mag2-cols--p1">
          <Flow pieces={pieces} doc={doc} />
        </div>
      </div>
      {photo && (
        <div
          className="mag2-strip"
          style={{ backgroundImage: `url("${photo.src}")`, ...stripBg(p) }}
        >
          {doc.meta.photoCredit && <span className="mag2-strip-credit">FOTO — {doc.meta.photoCredit}</span>}
        </div>
      )}
    </div>
  );
}

/** magazine-2 sheet 2: the same single photo, continued full-bleed. Its window
 *  starts exactly where sheet 1's strip stopped, so the two meet at the fold. */
export function MagPhotoPage({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  const photo = photoOf(doc);
  const p = splitPhoto(arOf(doc));
  const style: CSSProperties = {
    ...vars,
    ...(photo ? { backgroundImage: `url("${photo.src}")`, ...photoPageBg(p) } : null),
  };

  return (
    <div className="page mag2-photo" style={style}>
      {doc.meta.location && <span className="mag2-photo-tag">{doc.meta.location}</span>}
    </div>
  );
}
