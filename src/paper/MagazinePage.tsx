import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { Flow } from './Flow';
import { MagazineHead } from './MagazineHead';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pieces: Piece[];
  /** Real sheet number shown in the footer (cover is 1, first spread is 2, …). */
  pageNo: number;
  /** The first content sheet carries the hero photo + pull-quote header. */
  lead: boolean;
  /** Draw the hero header on the lead sheet. False for magazine-3, whose gatefold
   *  cover already carries the photo — the lead sheet is columns + drop cap only. */
  head?: boolean;
}

/** Magazine page 2+: a 2-column justified spread. The lead sheet opens with the
 *  hero photo, location tag and pull-quote; later sheets are columns only. */
export function MagazinePage({ doc, vars, pieces, pageNo, lead, head = true }: Props) {
  return (
    <div className="page mag-page" style={vars}>
      {lead && head && <MagazineHead doc={doc} />}
      <div className={`mag-cols ${lead ? 'mag-cols--p1' : 'mag-cols--p2'}`}>
        <Flow pieces={pieces} doc={doc} />
      </div>
      <div className="page-footer mag-footer">{String(pageNo).padStart(3, '0')}</div>
    </div>
  );
}
