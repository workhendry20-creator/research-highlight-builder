import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { HighlightsBody } from './Sidebar';

/** Synthetic flow item id: the highlights block when placed below the article.
 *  It rides the atomic full-width figure machinery so paginate() is untouched. */
export const HIGHLIGHTS_BLOCK_ID = '__highlights__';

/** Renders a page's pieces into the column flow: paragraphs and full-width
 *  figures. Figures resolve their image/caption from the doc by id. */
export function Flow({ pieces, doc }: { pieces: Piece[]; doc: Doc }) {
  // 'page1-flow' rides the same end-of-flow atom as 'below', but renders it as a
  // one-column box (.hl-col) instead of the full-width band (.hl-below).
  const hlClass = doc.design.highlightsPlacement === 'page1-flow' ? 'hl-col' : 'hl-below';
  return (
    <>
      {pieces.map((pc, i) => {
        if (pc.kind === 'figure') {
          if (pc.id === HIGHLIGHTS_BLOCK_ID) {
            return (
              <aside className={hlClass} key={i}>
                <HighlightsBody doc={doc} />
              </aside>
            );
          }
          const block = doc.blocks.find((b) => b.id === pc.id);
          if (!block || block.type !== 'figure') return null;
          const asset = doc.assets[block.assetId];
          if (!asset) return null;
          return (
            <figure className={`flow-fig ${block.span === 'body' ? 'flow-fig--full' : 'flow-fig--col'}`} key={i}>
              <img src={asset.src} alt="" />
              {block.caption.trim() && (
                <figcaption style={{ textAlign: block.align ?? 'left' }}>{block.caption}</figcaption>
              )}
            </figure>
          );
        }
        return (
          <p key={i} className={pc.cont ? 'cont' : undefined}>
            {pc.text}
          </p>
        );
      })}
    </>
  );
}
