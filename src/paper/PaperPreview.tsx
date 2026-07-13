import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDoc } from '../store/useDoc';
import { cssVars, PAGE_W, PAGE_H } from '../lib/geometry';
import { paginate, fitMessage, type FlowItem, type Pagination } from '../lib/paginate';
import { Page1 } from './Page1';
import { Page2 } from './Page2';
import { HighlightsBody } from './Sidebar';
import { HIGHLIGHTS_BLOCK_ID } from './Flow';

const EMPTY: Pagination = { page1: [], page2: [], fill: 0, overflow: false, spill: 0 };

// A4 in CSS px at the reference 96dpi (1mm = 96/25.4 px). Preview-only: used to
// size the zoom frame, never for layout/pagination (those stay in mm/pt).
const MM_PX = 96 / 25.4;
const PAGE_W_PX = PAGE_W * MM_PX;
const PAGE_H_PX = PAGE_H * MM_PX;
const PAGE_GAP_PX = 20; // .page bottom margin
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

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
  const hlRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<Pagination>(EMPTY);
  const [headerPx, setHeaderPx] = useState(0);

  // Highlights placed below the article become the last item in the text flow.
  const hlBelow =
    doc.design.sidebar &&
    (doc.design.highlightsPlacement ?? 'page1') === 'below' &&
    (doc.highlights.some((h) => h.trim()) || doc.references.length > 0);

  // Preview zoom. 'fit' tracks the pane width (Word's "Page Width"); a number is
  // a manual zoom. Cosmetic only — the sheet scales, the pt/mm sizes do not.
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth - 40; // .paper-scroll padding (20px each side)
      setFitScale(clamp(avail / PAGE_W_PX, 0.25, 1)); // cap 1: fit only shrinks
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

    // When highlights sit below the article, measure that block at body width
    // and append it as an atomic full-width item so it paginates like a figure.
    let flow = items;
    if (hlBelow && hlRef.current) {
      const bodyW = h1.clientWidth || 1;
      flow = [
        ...items,
        { kind: 'figure', id: HIGHLIGHTS_BLOCK_ID, aspect: hlRef.current.offsetHeight / bodyW, hasCaption: false, full: true },
      ];
    }
    setPagination(paginate(h1, h2, flow));
  }, [baseVars, items, doc.meta, doc.design, doc.highlights, doc.references, hlBelow]);

  const vars = {
    ...baseVars,
    '--header-h': `${headerPx}px`,
    '--footer-h': '10mm',
  } as React.CSSProperties;

  const fit = fitMessage(pagination);
  const hasPage2 = pagination.page2.length > 0;

  const scale = zoom === 'fit' ? fitScale : zoom;
  const pct = Math.round(scale * 100);
  const nPages = hasPage2 ? 2 : 1;
  const frame = {
    width: PAGE_W_PX * scale,
    height: nPages * (PAGE_H_PX + PAGE_GAP_PX) * scale,
  };
  const step = (d: number) => setZoom(clamp(Math.round((scale + d) * 100) / 100, 0.25, 2));

  return (
    <div className="paper-scroll" ref={scrollRef}>
      {/* Escape hatch — raw CSS from the design panel, scoped by author intent. */}
      {doc.design.customCss && <style>{doc.design.customCss}</style>}

      <div className="preview-bar">
        <span className={`fit-badge fit-${fit.level}`}>{fit.text}</span>
        <div className="zoom-bar">
          <button
            type="button"
            className={`zoom-btn${zoom === 'fit' ? ' is-active' : ''}`}
            onClick={() => setZoom('fit')}
          >
            Fit
          </button>
          <button type="button" className="zoom-btn" onClick={() => step(-0.1)} title="Perkecil">
            −
          </button>
          <span className="zoom-val">{pct}%</span>
          <button type="button" className="zoom-btn" onClick={() => step(0.1)} title="Perbesar">
            +
          </button>
          <button
            type="button"
            className={`zoom-btn${zoom === 1 ? ' is-active' : ''}`}
            onClick={() => setZoom(1)}
          >
            100%
          </button>
        </div>
      </div>

      <div className="pages-frame" style={frame}>
        <div className="pages" style={{ transform: `scale(${scale})` }}>
          <Page1 doc={doc} vars={vars} pagination={pagination} />
          {hasPage2 && <Page2 doc={doc} vars={vars} pagination={pagination} />}
        </div>
      </div>

      {/* Hidden measuring rig — same box as the real body columns. */}
      <div className="measure-root" style={vars} aria-hidden>
        <div className="page">
          <div className="body-cols body-cols--p1" ref={host1Ref} />
        </div>
        <div className="page">
          <div className="body-cols body-cols--p2" ref={host2Ref} />
        </div>
        {/* Below-article highlights: measured at body width to size its atom. */}
        {hlBelow && (
          <div style={{ width: 'var(--body-1)' }}>
            <aside className="hl-below" ref={hlRef}>
              <HighlightsBody doc={doc} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
