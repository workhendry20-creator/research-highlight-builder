import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDoc } from '../store/useDoc';
import { cssVars } from '../lib/geometry';
import { paginate, fitMessage, type FlowItem, type Pagination } from '../lib/paginate';
import { Page1 } from './Page1';
import { Page2 } from './Page2';

const EMPTY: Pagination = { page1: [], page2: [], fill: 0, overflow: false, spill: 0 };

export function PaperPreview() {
  const doc = useDoc((s) => s.doc);

  const baseVars = useMemo(() => cssVars(doc.design), [doc.design]);
  const items = useMemo<FlowItem[]>(
    () =>
      doc.blocks.map((b) => {
        if (b.type === 'paragraph') return { kind: 'text', text: b.text };
        const asset = doc.assets[b.assetId];
        return {
          kind: 'figure',
          id: b.id,
          aspect: asset ? asset.naturalHeight / asset.naturalWidth : 0.6,
          hasCaption: b.caption.trim() !== '',
          full: b.span === 'body',
        };
      }),
    [doc.blocks, doc.assets],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const host1Ref = useRef<HTMLDivElement>(null);
  const host2Ref = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<Pagination>(EMPTY);
  const [headerPx, setHeaderPx] = useState(0);

  // The two body boxes are sized off --header-h / --footer-h, which we only know
  // after the real header paints. Measure it, feed the measuring hosts the same
  // box, then break the text once.
  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const h1 = host1Ref.current;
    const h2 = host2Ref.current;
    if (!scroll || !h1 || !h2) return;

    const header = scroll.querySelector<HTMLElement>('.header');
    const headerH = header ? header.offsetHeight : 0;
    setHeaderPx(headerH);

    const root = h1.closest<HTMLElement>('.measure-root');
    if (root) {
      root.style.setProperty('--header-h', `${headerH}px`);
      root.style.setProperty('--footer-h', '10mm');
    }

    setPagination(paginate(h1, h2, items));
  }, [baseVars, items, doc.meta, doc.design]);

  const vars = {
    ...baseVars,
    '--header-h': `${headerPx}px`,
    '--footer-h': '10mm',
  } as React.CSSProperties;

  const fit = fitMessage(pagination);
  const hasPage2 = pagination.page2.length > 0;

  return (
    <div className="paper-scroll" ref={scrollRef}>
      {/* Escape hatch — raw CSS from the design panel, scoped by author intent. */}
      {doc.design.customCss && <style>{doc.design.customCss}</style>}
      <span className={`fit-badge fit-${fit.level}`}>{fit.text}</span>

      <Page1 doc={doc} vars={vars} pagination={pagination} />
      {hasPage2 && <Page2 doc={doc} vars={vars} pagination={pagination} />}

      {/* Hidden measuring rig — same box as the real body columns. */}
      <div className="measure-root" style={vars} aria-hidden>
        <div className="page">
          <div className="body-cols body-cols--p1" ref={host1Ref} />
        </div>
        <div className="page">
          <div className="body-cols body-cols--p2" ref={host2Ref} />
        </div>
      </div>
    </div>
  );
}
