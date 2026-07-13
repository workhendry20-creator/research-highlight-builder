import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';

/** Renders a page's pieces into the column flow: paragraphs and full-width
 *  figures. Figures resolve their image/caption from the doc by id. */
export function Flow({ pieces, doc }: { pieces: Piece[]; doc: Doc }) {
  return (
    <>
      {pieces.map((pc, i) => {
        if (pc.kind === 'figure') {
          const block = doc.blocks.find((b) => b.id === pc.id);
          if (!block || block.type !== 'figure') return null;
          const asset = doc.assets[block.assetId];
          if (!asset) return null;
          return (
            <figure className={`flow-fig ${block.span === 'body' ? 'flow-fig--full' : 'flow-fig--col'}`} key={i}>
              <img src={asset.src} alt="" />
              {block.caption.trim() && <figcaption>{block.caption}</figcaption>}
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
