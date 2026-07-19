import type { Doc } from '../schema/document';

/** The page-2 spread header: a full-width hero photo with a location tag, its
 *  credit line, and the pull-quote. Rendered identically in the real spread and
 *  in the hidden measuring host, so the height it reserves is always exact. */
export function MagazineHead({ doc }: { doc: Doc }) {
  const { meta, hero, assets } = doc;
  const photo = hero.assetId ? assets[hero.assetId] : null;
  // magazine-1 drops the "FOTO —" label and prints the credit as-is.
  const mag1 = doc.templateId === 'magazine-1';
  return (
    <div className="mag-head">
      {photo && (
        <figure className="mag-hero">
          <img src={photo.src} alt="" />
          {meta.location && <figcaption className="mag-hero-tag">{meta.location}</figcaption>}
        </figure>
      )}
      {meta.photoCredit && (
        <p className="mag-hero-credit">{mag1 ? meta.photoCredit : `FOTO — ${meta.photoCredit}`}</p>
      )}
      {meta.pullQuote && (
        <blockquote className="mag-quote">
          <span className="mag-quote-text">{meta.pullQuote}</span>
          {meta.pullQuoteBy && <cite className="mag-quote-by">{meta.pullQuoteBy}</cite>}
        </blockquote>
      )}
    </div>
  );
}
