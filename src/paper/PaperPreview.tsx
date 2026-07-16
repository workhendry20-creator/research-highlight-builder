import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDoc } from '../store/useDoc';
import { familyOf } from '../schema/document';
import { cssVars, PAGE_W, PAGE_H } from '../lib/geometry';
import { paginate, fitMessage, type FlowItem, type Pagination } from '../lib/paginate';
import { applyMark } from '../lib/activeEditor';
import type { Mark } from '../lib/richtext';
import { Page1 } from './Page1';
import { ContPage } from './ContPage';
import { MagazineCover } from './MagazineCover';
import { MagazinePage } from './MagazinePage';
import { MagazineHead } from './MagazineHead';
import { HighlightsBody } from './Sidebar';
import { HIGHLIGHTS_BLOCK_ID } from './Flow';

const EMPTY: Pagination = { pages: [], fill: 0, spill: 0 };

const FORMAT_BTNS: { mark: Mark; label: string; title: string }[] = [
  { mark: 'b', label: 'B', title: 'Tebal (⌘/Ctrl+B)' },
  { mark: 'i', label: 'I', title: 'Miring (⌘/Ctrl+I)' },
  { mark: 'u', label: 'U', title: 'Garis bawah (⌘/Ctrl+U)' },
];

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

  const isMag = familyOf(doc.templateId) === 'magazine';

  const scrollRef = useRef<HTMLDivElement>(null);
  const host1Ref = useRef<HTMLDivElement>(null);
  const host2Ref = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const hlColRef = useRef<HTMLDivElement>(null);
  const magHost1Ref = useRef<HTMLDivElement>(null);
  const magHost2Ref = useRef<HTMLDivElement>(null);
  const magHeadRef = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<Pagination>(EMPTY);
  const [headerPx, setHeaderPx] = useState(0);
  const [magHeadPx, setMagHeadPx] = useState(0);

  // Highlights that ride the text flow as the last item: 'below' as a full-width
  // band, 'page1-flow' as a one-column box that lets text fill the gap above it.
  const placement = doc.design.highlightsPlacement ?? 'page1';
  const hasHl =
    doc.design.sidebar && (doc.highlights.some((h) => h.trim()) || doc.references.length > 0);
  const hlBelow = hasHl && placement === 'below';
  const hlFlow = hasHl && placement === 'page1-flow';

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
    if (!scroll) return;

    // Magazine: page 1 is a cover (no flow). The body flows from page 2 into a
    // 2-column box. The first spread reserves room for the pull-quote, so its
    // measuring host (mh1) is shorter than the plain host (mh2) — same two-host
    // trick paper uses for the page-1 header.
    if (isMag) {
      const mh1 = magHost1Ref.current;
      const mh2 = magHost2Ref.current;
      if (!mh1 || !mh2) return;
      const headH = magHeadRef.current?.offsetHeight ?? 0;
      setMagHeadPx(headH);
      const root = mh1.closest<HTMLElement>('.measure-root');
      if (root) {
        root.style.setProperty('--footer-h', '10mm');
        root.style.setProperty('--mag-head-h', `${headH}px`);
      }
      setPagination(paginate(mh1, mh2, items));
      return;
    }

    const h1 = host1Ref.current;
    const h2 = host2Ref.current;
    if (!h1 || !h2) return;

    const header = scroll.querySelector<HTMLElement>('.header');
    const headerH = header ? header.offsetHeight : 0;
    setHeaderPx(headerH);

    const root = h1.closest<HTMLElement>('.measure-root');
    if (root) {
      root.style.setProperty('--header-h', `${headerH}px`);
      root.style.setProperty('--footer-h', '10mm');
    }

    // Highlights that ride the flow are appended as one atomic item, measured at
    // its own render width so it paginates like a figure. 'below' is full-width
    // (spans all columns); 'page1-flow' is one column wide (text fills the gap).
    let flow = items;
    const hlNode = hlFlow ? hlColRef.current : hlBelow ? hlRef.current : null;
    if (hlNode) {
      const w = hlNode.offsetWidth || 1;
      flow = [
        ...items,
        { kind: 'figure', id: HIGHLIGHTS_BLOCK_ID, aspect: hlNode.offsetHeight / w, hasCaption: false, full: hlBelow },
      ];
    }
    setPagination(paginate(h1, h2, flow));
  }, [baseVars, items, doc.meta, doc.design, doc.highlights, doc.references, hlBelow, hlFlow, isMag]);

  const vars = {
    ...baseVars,
    '--header-h': `${headerPx}px`,
    '--footer-h': '10mm',
    '--mag-head-h': `${magHeadPx}px`,
  } as React.CSSProperties;

  const fit = fitMessage(pagination);
  const pages = pagination.pages;

  const scale = zoom === 'fit' ? fitScale : zoom;
  const pct = Math.round(scale * 100);
  // Magazine adds the cover sheet on top of the flowed content pages.
  const nPages = isMag ? 1 + pages.length : Math.max(1, pages.length);
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
        {/* Word-style formatting bar. onMouseDown+preventDefault keeps the
            focused paragraph textarea's selection alive while we apply the mark. */}
        <div className="format-bar">
          {FORMAT_BTNS.map((f) => (
            <button
              key={f.mark}
              type="button"
              className={`format-btn format-btn--${f.mark}`}
              title={f.title}
              onMouseDown={(e) => {
                e.preventDefault();
                applyMark(f.mark);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
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
          {isMag ? (
            <>
              <MagazineCover doc={doc} vars={vars} />
              {pages.map((pcs, i) => (
                <MagazinePage
                  key={i}
                  doc={doc}
                  vars={vars}
                  pieces={pcs}
                  pageNo={i + 2}
                  lead={i === 0}
                />
              ))}
            </>
          ) : (
            <>
              <Page1 doc={doc} vars={vars} pieces={pages[0] ?? []} />
              {pages.slice(1).map((pcs, i) => (
                <ContPage key={i} doc={doc} vars={vars} pieces={pcs} pageNo={i + 2} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Hidden measuring rig — same box as the real body columns. */}
      <div className="measure-root" style={vars} aria-hidden>
        {isMag ? (
          <>
            {/* Header sized first (sets --mag-head-h), then the two 2-col hosts. */}
            <div
              className="mag-head-measure"
              ref={magHeadRef}
              style={{ width: 'calc(var(--page-w) - 2 * var(--margin))' }}
            >
              <MagazineHead doc={doc} />
            </div>
            <div className="mag-cols mag-cols--p1" ref={magHost1Ref} />
            <div className="mag-cols mag-cols--p2" ref={magHost2Ref} />
          </>
        ) : null}
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
        {/* In-flow highlights: measured at one column's width. */}
        {hlFlow && (
          <div style={{ width: 'var(--col)' }}>
            <aside className="hl-col" ref={hlColRef}>
              <HighlightsBody doc={doc} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
