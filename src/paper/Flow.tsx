import { Fragment, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { parseRuns, renderTex } from '../lib/richtext';
import { fitEquation } from '../lib/mathfit';
import { HighlightsBody } from './Sidebar';
import { MagSplitAside } from './MagSplitHead';

/** A standalone display equation with an optional caption. KaTeX can't wrap math,
 *  so a too-wide formula is scaled down to the column rather than running off the
 *  edge — re-fit after every render (covers tex edits and column-width changes). */
function DisplayEquation({ tex, caption, align }: { tex: string; caption: string; align?: 'left' | 'center' | 'right' }) {
  const texRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (texRef.current) fitEquation(texRef.current);
  });
  return (
    <figure className="flow-eq">
      <span ref={texRef} className="flow-eq-tex" dangerouslySetInnerHTML={{ __html: renderTex(tex, true) }} />
      {caption.trim() && (
        <figcaption style={{ textAlign: align ?? 'center' }}>{renderRuns(caption)}</figcaption>
      )}
    </figure>
  );
}

/** Turn a paragraph string with **bold** / *italic* / __underline__ markers and
 *  `$…$` math into styled inline nodes. React escapes the text; KaTeX HTML is
 *  trusted output rendered with throwOnError:false. */
function renderRuns(text: string): ReactNode {
  return parseRuns(text).map((r, j) => {
    if (r.math)
      return <span key={j} className="tex" dangerouslySetInnerHTML={{ __html: renderTex(r.text) }} />;
    let node: ReactNode = r.text;
    if (r.b) node = <strong>{node}</strong>;
    if (r.i) node = <em>{node}</em>;
    if (r.u) node = <u>{node}</u>;
    return <Fragment key={j}>{node}</Fragment>;
  });
}

/** Synthetic flow item id: the highlights block when placed below the article.
 *  It rides the atomic full-width figure machinery so paginate() is untouched. */
export const HIGHLIGHTS_BLOCK_ID = '__highlights__';

/** Same trick for magazine-2's pull-quote + highlights: one atomic one-column
 *  item at the very end of the flow, so it always closes the last column. */
export const MAG2_ASIDE_ID = '__mag2_aside__';

/** Renders a page's pieces into the column flow: paragraphs and full-width
 *  figures. Figures resolve their image/caption from the doc by id. */
export function Flow({ pieces, doc }: { pieces: Piece[]; doc: Doc }) {
  // 'page1-flow' rides the same end-of-flow atom as 'below', but renders it as a
  // one-column box (.hl-col) instead of the full-width band (.hl-below).
  const hlClass = doc.design.highlightsPlacement === 'page1-flow' ? 'hl-col' : 'hl-below';
  return (
    <>
      {pieces.map((pc, i) => {
        if (pc.kind === 'equation') {
          const block = doc.blocks.find((b) => b.id === pc.id);
          if (!block || block.type !== 'equation') return null;
          return <DisplayEquation key={i} tex={block.tex} caption={block.caption} align={block.align} />;
        }
        if (pc.kind === 'figure') {
          if (pc.id === MAG2_ASIDE_ID) return <MagSplitAside doc={doc} key={i} />;
          if (pc.id === HIGHLIGHTS_BLOCK_ID) {
            // magazine-1's band is highlights-only — no references.
            return (
              <aside className={hlClass} key={i}>
                <HighlightsBody doc={doc} hideRefs={doc.templateId === 'magazine-1'} />
              </aside>
            );
          }
          const block = doc.blocks.find((b) => b.id === pc.id);
          if (!block || block.type !== 'figure') return null;
          const asset = doc.assets[block.assetId];
          if (!asset) return null;
          const spanClass =
            block.span === 'bleed' ? 'flow-fig--bleed' : block.span === 'body' ? 'flow-fig--full' : 'flow-fig--col';
          return (
            <figure className={`flow-fig ${spanClass}`} key={i}>
              <img src={asset.src} alt="" />
              {block.caption.trim() && (
                <figcaption style={{ textAlign: block.align ?? 'left' }}>
                  {renderRuns(block.caption)}
                </figcaption>
              )}
            </figure>
          );
        }
        return (
          <p key={i} className={pc.cont ? 'cont' : undefined}>
            {renderRuns(pc.text)}
          </p>
        );
      })}
    </>
  );
}
