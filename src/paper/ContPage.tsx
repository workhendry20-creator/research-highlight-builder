import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { grid } from '../lib/geometry';
import { Sidebar } from './Sidebar';
import { Flow } from './Flow';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pieces: Piece[];
  /** Real sheet number (2, 3, 4, …) shown in the footer. */
  pageNo: number;
}

/** A continuation sheet: no hero/header, just the taller body box. Every page
 *  after page 1 shares this geometry, so one component renders them all. */
export function ContPage({ doc, vars, pieces, pageNo }: Props) {
  const { railEvery } = grid(doc.design);
  const body = (
    <div className={`body-cols body-cols--p2${railEvery ? ' body-cols--railed' : ''}`}>
      <Flow pieces={pieces} doc={doc} />
    </div>
  );

  return (
    <div className="page" style={vars}>
      {railEvery ? (
        <div className="body-row">
          {body}
          <Sidebar doc={doc} />
        </div>
      ) : (
        body
      )}
      <div className="page-footer">{pageNo}</div>
    </div>
  );
}
