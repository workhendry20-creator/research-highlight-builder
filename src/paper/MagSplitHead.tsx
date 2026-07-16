import type { Doc } from '../schema/document';

/** magazine-2 masthead band + title block. Rendered identically in the real
 *  sheet and in the hidden measuring host, so the height it steals from the
 *  body columns is always exact. */
export function MagSplitHead({ doc }: { doc: Doc }) {
  const { meta } = doc;
  return (
    <div className="mag2-head">
      <div className="mag2-band">
        <span className="mag2-band-mast">{meta.masthead || meta.affiliation}</span>
        <span className="mag2-band-vol">{meta.volume}</span>
      </div>
      {meta.categoryLabel && <p className="mag2-kicker">{meta.categoryLabel}</p>}
      <h1 className="mag2-title">{meta.title}</h1>
      {meta.subtitle && <p className="mag2-lede">{meta.subtitle}</p>}
      <div className="mag2-byline">
        {meta.author && <span className="mag2-author">{meta.author}</span>}
        {meta.affiliation && <span className="mag2-affil">{meta.affiliation}</span>}
      </div>
    </div>
  );
}

/** The foot of magazine-2's sheet 1: pull-quote, then the highlights box. Also
 *  measured (its height comes off the body box, same as the head). */
export function MagSplitAside({ doc }: { doc: Doc }) {
  const highlights = doc.highlights.filter((h) => h.trim());
  const { meta } = doc;
  if (!meta.pullQuote && !highlights.length) return null;
  return (
    <div className="mag2-aside">
      {meta.pullQuote && (
        <blockquote className="mag2-quote">
          <span className="mag2-quote-text">{meta.pullQuote}</span>
          {meta.pullQuoteBy && <cite className="mag2-quote-by">{meta.pullQuoteBy}</cite>}
        </blockquote>
      )}
      {highlights.length > 0 && (
        <aside className="mag2-hl">
          <h3>Highlights</h3>
          <ul>
            {highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
