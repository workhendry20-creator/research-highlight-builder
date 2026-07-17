import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Piece } from '../lib/paginate';
import { paper2Grid } from '../lib/paper2';
import { Sidebar } from './Sidebar';
import { TagBar } from './TagBar';
import { Flow } from './Flow';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  /** Text for the columns beside the header. */
  left: Piece[];
  /** Text for the column under the hero. */
  right: Piece[];
}

/** paper-2's sheet 1: a full-bleed tag band, then a header/hero split across the
 *  same column grid every other page uses. Sheets 2+ stay on ContPage. */
export function PaperTwoPage({ doc, vars, left, right }: Props) {
  const { meta, hero, design } = doc;
  const heroAsset = hero.assetId ? doc.assets[hero.assetId] : null;
  const { rail } = paper2Grid(design);

  return (
    <div className="page page--p2" style={vars}>
      <TagBar doc={doc} />

      <div className="p2-cols">
        <div className="p2-left">
          <header className="header p2-head">
            <p className="eyebrow">{meta.categoryLabel}</p>
            <h1 className="title">{meta.title}</h1>
            {meta.subtitle && <p className="subtitle">{meta.subtitle}</p>}
            <p className="byline">
              {meta.author}
              {meta.affiliation && <span className="affiliation"> · {meta.affiliation}</span>}
            </p>
          </header>
          <div className="body-cols p2-flow-l">
            <Flow pieces={left} doc={doc} />
          </div>
        </div>

        <div className="p2-right">
          <div className="p2-heroblock">
            <div className="p2-hero">
              {heroAsset && (
                <img
                  src={heroAsset.src}
                  alt=""
                  style={{
                    transform: `translate(${hero.offsetX}%, ${hero.offsetY}%) scale(${hero.scale})`,
                  }}
                />
              )}
            </div>
            {meta.heroCaption && <p className="p2-hero-cap">{meta.heroCaption}</p>}
          </div>
          <div className="p2-right-row">
            <div className="body-cols p2-flow-r">
              <Flow pieces={right} doc={doc} />
            </div>
            {rail && <Sidebar doc={doc} />}
          </div>
        </div>
      </div>
    </div>
  );
}
