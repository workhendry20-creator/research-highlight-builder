import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Pagination } from '../lib/paginate';
import { grid } from '../lib/geometry';
import { Sidebar } from './Sidebar';
import { Flow } from './Flow';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pagination: Pagination;
}

export function Page1({ doc, vars, pagination }: Props) {
  const { meta, hero, design } = doc;
  const heroAsset = hero.assetId ? doc.assets[hero.assetId] : null;
  const { rail } = grid(design);

  return (
    <div className="page" style={vars}>
      <div className="hero">
        {heroAsset && (
          <img
            src={heroAsset.src}
            alt=""
            style={{ transform: `translate(${hero.offsetX}%, ${hero.offsetY}%) scale(${hero.scale})` }}
          />
        )}
      </div>
      <header className="header">
        <p className="eyebrow">{meta.categoryLabel}</p>
        <h1 className="title">{meta.title}</h1>
        {meta.subtitle && <p className="subtitle">{meta.subtitle}</p>}
        <p className="byline">
          {meta.author}
          {meta.affiliation && <span className="affiliation"> · {meta.affiliation}</span>}
        </p>
      </header>
      <div className="body-row">
        <div className="body-cols body-cols--p1">
          <Flow pieces={pagination.page1} doc={doc} />
        </div>
        {rail && <Sidebar doc={doc} />}
      </div>
    </div>
  );
}
