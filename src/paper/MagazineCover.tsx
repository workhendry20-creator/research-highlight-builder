import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';

/** Magazine page 1: a full-bleed photo cover / masthead. Giant stacked title
 *  with its last word in red, kicker above it, masthead + volume on top, and the
 *  byline / photo credit at the foot over a dark gradient scrim. */
export function MagazineCover({ doc, vars }: { doc: Doc; vars: CSSProperties }) {
  const { meta, hero, assets } = doc;
  const photo = hero.assetId ? assets[hero.assetId] : null;
  const words = meta.title.trim().split(/\s+/).filter(Boolean);
  const mag1 = doc.templateId === 'magazine-1';

  const style: CSSProperties = {
    ...vars,
    ...(photo ? { backgroundImage: `url("${photo.src}")` } : null),
  };

  return (
    <div className="page mag-cover" style={style}>
      <div className="mag-cover-scrim" />
      <div className="mag-cover-inner">
        <div className="mag-cover-top">
          <span className="mag-masthead">{meta.masthead || meta.affiliation}</span>
          <span className="mag-vol">{meta.volume}</span>
        </div>

        <div className="mag-cover-mid">
          {meta.categoryLabel && (
            <p className="mag-kicker">
              <span className="mag-kicker-dash" />
              {meta.categoryLabel}
            </p>
          )}
          <h1 className="mag-title">
            {words.map((w, i) => (
              <span
                key={i}
                className={`mag-title-word${i === words.length - 1 ? ' is-accent' : ''}`}
              >
                {w}
              </span>
            ))}
          </h1>
          {meta.subtitle && <p className="mag-lede">{meta.subtitle}</p>}
        </div>

        <div className="mag-cover-foot">
          <div className="mag-cover-credits">
            {/* magazine-1 shows the raw values; other magazines keep the labels. */}
            {meta.author && <span>{mag1 ? meta.author : `OLEH ${meta.author}`}</span>}
            {meta.photoCredit && (
              <span>{mag1 ? meta.photoCredit : `FOTO: ${meta.photoCredit}`}</span>
            )}
          </div>
          <span className="mag-folio">001</span>
        </div>
      </div>
    </div>
  );
}
