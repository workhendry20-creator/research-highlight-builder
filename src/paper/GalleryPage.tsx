import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { Doc, Block } from '../schema/document';
import { parseRuns, renderTex } from '../lib/richtext';

/** Inline **bold** / *italic* / __underline__ + `$…$` math → styled nodes. */
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

/** Split a tile's text on the first newline: line 1 title, the rest description. */
function titled(text: string): { title: string; desc: string } {
  const nl = text.indexOf('\n');
  if (nl === -1) return { title: text.trim(), desc: '' };
  return { title: text.slice(0, nl).trim(), desc: text.slice(nl + 1).trim() };
}

function TileText({ text, className }: { text: string; className: string }) {
  const { title, desc } = titled(text);
  return (
    <div className={className}>
      {title && <p className="g-title">{renderRuns(title)}</p>}
      {desc && <p className="g-desc">{renderRuns(desc)}</p>}
    </div>
  );
}

function ImageCell({ doc, block, area }: { doc: Doc; block?: Block; area: string }) {
  const asset = block && block.type === 'figure' ? doc.assets[block.assetId] : undefined;
  const caption = block && block.type === 'figure' ? block.caption : '';
  const fr = block && block.type === 'figure' ? block.frame : undefined;
  const imgStyle: CSSProperties = fr
    ? { transform: `translate(${fr.offsetX}%, ${fr.offsetY}%) scale(${fr.scale})` }
    : {};
  return (
    <figure className="g-img" style={{ gridArea: area }}>
      {asset ? <img src={asset.src} alt="" style={imgStyle} /> : <span className="g-img-empty" />}
      {caption.trim() && <figcaption><TileText text={caption} className="g-cap" /></figcaption>}
    </figure>
  );
}

/** One half of the fold image. The <img> is twice the cell width and anchored at
 *  the fold edge; both halves share the figure's `frame`, and the zoom scales from
 *  the fold (transform-origin), so the two sides stay locked together across the
 *  fold no matter how the user zooms or shifts it. Cell widths are kept equal on
 *  both pages (see gallery.css) so the seam matches. */
function FoldCell({ doc, block, area, half }: { doc: Doc; block?: Block; area: string; half: 'left' | 'right' }) {
  const asset = block && block.type === 'figure' ? doc.assets[block.assetId] : undefined;
  const caption = block && block.type === 'figure' ? block.caption : '';
  const fr = (block && block.type === 'figure' && block.frame) || { scale: 1, offsetX: 0, offsetY: 0 };
  const imgStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '200%',
    left: half === 'left' ? 0 : '-100%',
    objectFit: 'cover',
    // Both halves share one frame and one transform, with the scale origin on the
    // fold, so zoom AND pan move the two sides identically — the seam holds.
    transform: `translate(${fr.offsetX}%, ${fr.offsetY}%) scale(${fr.scale})`,
    transformOrigin: half === 'left' ? 'right center' : 'left center',
  };
  return (
    <figure className={`g-img g-fold${asset ? '' : ' is-empty'}`} style={{ gridArea: area }}>
      {asset && <img src={asset.src} alt="" style={imgStyle} />}
      {/* Caption only on the left half (page 1) so it isn't printed twice. */}
      {half === 'left' && caption.trim() && (
        <figcaption><TileText text={caption} className="g-cap" /></figcaption>
      )}
    </figure>
  );
}

function CardCell({ block, area }: { block?: Block; area: string }) {
  const text = block && block.type === 'paragraph' ? block.text : '';
  return (
    <div className="g-card" style={{ gridArea: area }}>
      {text.trim() && <TileText text={text} className="g-card-body" />}
    </div>
  );
}

function Head({ doc }: { doc: Doc }) {
  return (
    <header className="g-head" style={{ gridArea: 'head' }}>
      <span className="g-head-bar" />
      <span className="g-head-label">{doc.meta.masthead || doc.meta.title || 'TEXT'}</span>
      <span className="g-head-bar" />
    </header>
  );
}

/**
 * The gallery template: two A4 pages read as an open spread. Figures fill the
 * image slots in order (fig[1] is the fold image spanning both pages); paragraphs
 * fill the text-card slots (2 on page 1, 3 on page 2).
 */
export function GalleryPage({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  if (doc.templateId === 'gallery-2') return <GalleryTwo doc={doc} vars={vars} />;

  const figures = doc.blocks.filter((b) => b.type === 'figure');
  const cards = doc.blocks.filter((b) => b.type === 'paragraph');

  return (
    <>
      <div className="page gallery gallery--p1" style={vars}>
        <Head doc={doc} />
        <ImageCell doc={doc} block={figures[0]} area="img-1" />
        <FoldCell doc={doc} block={figures[1]} area="img-2" half="left" />
        <ImageCell doc={doc} block={figures[2]} area="img-3" />
        <CardCell block={cards[0]} area="card-1" />
        <CardCell block={cards[1]} area="card-2" />
      </div>

      <div className="page gallery gallery--p2" style={vars}>
        <Head doc={doc} />
        <FoldCell doc={doc} block={figures[1]} area="img-2" half="right" />
        <ImageCell doc={doc} block={figures[3]} area="img-4" />
        <ImageCell doc={doc} block={figures[4]} area="img-5" />
        <CardCell block={cards[2]} area="card-3" />
        <CardCell block={cards[3]} area="card-4" />
        <CardCell block={cards[4]} area="card-5" />
      </div>
    </>
  );
}

/**
 * gallery-2: the fold image runs vertically down the centre of the spread —
 * fig[0]'s left half sits in page 1's right column, its right half in page 2's
 * left column (same FoldCell mechanism, same fold-edge bleed). Three tiles flank
 * it on each page with a pair of text cards. fig[1..6] fill the flanks in order.
 */
function GalleryTwo({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  const figures = doc.blocks.filter((b) => b.type === 'figure');
  const cards = doc.blocks.filter((b) => b.type === 'paragraph');

  return (
    <>
      <div className="page gallery gallery--p1 gallery2--p1" style={vars}>
        <Head doc={doc} />
        <FoldCell doc={doc} block={figures[0]} area="fold" half="left" />
        <ImageCell doc={doc} block={figures[1]} area="img-1" />
        <ImageCell doc={doc} block={figures[2]} area="img-2" />
        <ImageCell doc={doc} block={figures[3]} area="img-3" />
        <CardCell block={cards[0]} area="card-1" />
        <CardCell block={cards[1]} area="card-2" />
      </div>

      <div className="page gallery gallery--p2 gallery2--p2" style={vars}>
        <Head doc={doc} />
        <FoldCell doc={doc} block={figures[0]} area="fold" half="right" />
        <ImageCell doc={doc} block={figures[4]} area="img-4" />
        <ImageCell doc={doc} block={figures[5]} area="img-5" />
        <ImageCell doc={doc} block={figures[6]} area="img-6" />
        <CardCell block={cards[2]} area="card-3" />
        <CardCell block={cards[3]} area="card-4" />
      </div>
    </>
  );
}
