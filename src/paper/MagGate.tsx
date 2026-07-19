import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';

/** The gatefold photo — the page-1 cover image, split across the two facing cover
 *  sheets. Falls back to the hero for docs that never set a cover. */
function gateSrc(doc: Doc): string | null {
  const c = doc.cover ?? doc.hero;
  const asset = c.assetId ? doc.assets[c.assetId] : null;
  return asset?.src ?? null;
}

/** magazine-3 gatefold, sheet 1 (left half of the photo). Masthead + big stacked
 *  title over a dark scrim; the photo bleeds to the right (fold) edge so it joins
 *  sheet 2. `background-size: 200%` + `position: left` shows the image's left half. */
export function MagGateA({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  const { meta } = doc;
  const src = gateSrc(doc);
  const words = meta.title.trim().split(/\s+/).filter(Boolean);
  const style: CSSProperties = { ...vars, ...(src ? { backgroundImage: `url("${src}")` } : null) };
  return (
    <div className="page mag-gate mag-gate--a" style={style}>
      <div className="mag-gate-scrim mag-gate-scrim--a" />
      <div className="mag-gate-inner">
        <div className="mag-gate-top">
          <span className="mag-masthead">{meta.masthead || meta.affiliation}</span>
          <span className="mag-gate-vol">{meta.volume}</span>
        </div>

        <div className="mag-gate-mid">
          {meta.categoryLabel && (
            <p className="mag-kicker">
              <span className="mag-kicker-dash" />
              {meta.categoryLabel}
            </p>
          )}
          <h1 className="mag-title mag-gate-title">
            {words.map((w, i) => (
              <span key={i} className={`mag-title-word${i === words.length - 1 ? ' is-accent' : ''}`}>
                {w}
              </span>
            ))}
          </h1>
        </div>

        <div className="mag-gate-foot">
          <span className="mag-folio">001</span>
        </div>
      </div>
    </div>
  );
}

/** magazine-3 gatefold, sheet 2 (right half of the photo). Lede + pull-quote +
 *  byline/credit over a scrim; the photo bleeds to the left (fold) edge to meet
 *  sheet 1. `position: right` shows the image's right half. */
export function MagGateB({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  const { meta } = doc;
  const src = gateSrc(doc);
  const style: CSSProperties = { ...vars, ...(src ? { backgroundImage: `url("${src}")` } : null) };
  return (
    <div className="page mag-gate mag-gate--b" style={style}>
      <div className="mag-gate-scrim mag-gate-scrim--b" />
      <div className="mag-gate-inner mag-gate-inner--b">
        <div className="mag-gate-mid mag-gate-mid--b">
          {meta.subtitle && <p className="mag-gate-lede">{meta.subtitle}</p>}
          {meta.pullQuote && (
            <blockquote className="mag-gate-quote">
              <span className="mag-gate-quote-text">{meta.pullQuote}</span>
              {meta.pullQuoteBy && <cite className="mag-gate-quote-by">{meta.pullQuoteBy}</cite>}
            </blockquote>
          )}
        </div>

        <div className="mag-gate-foot mag-gate-foot--b">
          <div className="mag-gate-credits">
            {meta.author && <span>{meta.author}</span>}
            {meta.photoCredit && <span>FOTO: {meta.photoCredit}</span>}
          </div>
          <span className="mag-folio">002</span>
        </div>
      </div>
    </div>
  );
}
