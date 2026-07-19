import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDoc } from '../store/useDoc';
import { familyOf } from '../schema/document';
import { cssVars, grid, PAGE_W, PAGE_H } from '../lib/geometry';
import { paginate, paginateHosts, fitMessage, type FlowItem, type Pagination } from '../lib/paginate';
import { applyMark } from '../lib/activeEditor';
import { MAG2_STRIP } from '../lib/magSplit';
import { paper2Grid, paper2Fit } from '../lib/paper2';
import { P3_BAND_W } from '../lib/paper3';
import type { Mark } from '../lib/richtext';
import { Page1 } from './Page1';
import { PaperTwoPage } from './PaperTwo';
import { PaperThreePage1, PaperThreePage2, PaperThreeCont } from './PaperThree';
import { ContPage } from './ContPage';
import { MagazineCover } from './MagazineCover';
import { MagazinePage } from './MagazinePage';
import { MagazineHead } from './MagazineHead';
import { MagSplitCover, MagPhotoPage } from './MagSplitCover';
import { MagSplitHead, MagSplitAside } from './MagSplitHead';
import { HighlightsBody } from './Sidebar';
import { HIGHLIGHTS_BLOCK_ID, MAG2_ASIDE_ID } from './Flow';

const EMPTY: Pagination = { pages: [], fill: 0, spill: 0 };

const FORMAT_BTNS: { mark: Mark; label: string; title: string }[] = [
  { mark: 'b', label: 'B', title: 'Bold (⌘/Ctrl+B)' },
  { mark: 'i', label: 'I', title: 'Italic (⌘/Ctrl+I)' },
  { mark: 'u', label: 'U', title: 'Underline (⌘/Ctrl+U)' },
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
          full: b.span === 'body' || b.span === 'bleed',
          bleed: b.span === 'bleed',
        };
      }),
    [doc.blocks, doc.assets],
  );

  const isMag = familyOf(doc.templateId) === 'magazine';
  // magazine-2 runs a different sheet plan: sheet 1 is the article + photo strip,
  // sheet 2 is that same photo continued, spill goes to sheet 3+.
  const isSplit = doc.templateId === 'magazine-2';
  // paper-2 splits sheet 1 into two text regions (beside the header, then under
  // the hero) that start at different heights, so it breaks across three hosts.
  const isP2 = doc.templateId === 'paper-2';
  const p2 = useMemo(() => paper2Grid(doc.design), [doc.design]);
  // paper-3: the hero band eats a different slice of sheet 1 (band + header),
  // sheet 2 (band only) and sheets 3+ (none), so it too breaks across three hosts.
  const isP3 = doc.templateId === 'paper-3';
  // A bleeding figure can only bleed towards a free edge, so how wide it ends up
  // depends on whether a rail sits beside the box. The measuring twins must carry
  // the same flag as the real sheets or they would model the wrong width.
  const g = useMemo(() => grid(doc.design), [doc.design]);
  const railed = g.rail ? ' body-cols--railed' : '';
  const railedEvery = g.railEvery ? ' body-cols--railed' : '';

  const scrollRef = useRef<HTMLDivElement>(null);
  const host1Ref = useRef<HTMLDivElement>(null);
  const host2Ref = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);
  const hlColRef = useRef<HTMLDivElement>(null);
  const magHost1Ref = useRef<HTMLDivElement>(null);
  const magHost2Ref = useRef<HTMLDivElement>(null);
  const magHeadRef = useRef<HTMLDivElement>(null);
  const splitHost1Ref = useRef<HTMLDivElement>(null);
  const splitHeadRef = useRef<HTMLDivElement>(null);
  const splitAsideRef = useRef<HTMLDivElement>(null);
  const p2HostLRef = useRef<HTMLDivElement>(null);
  const p2HostRRef = useRef<HTMLDivElement>(null);
  const p3Host1Ref = useRef<HTMLDivElement>(null);
  const p3Host2Ref = useRef<HTMLDivElement>(null);
  const [pagination, setPagination] = useState<Pagination>(EMPTY);
  const [headerPx, setHeaderPx] = useState(0);
  const [magHeadPx, setMagHeadPx] = useState(0);
  const [splitHeadPx, setSplitHeadPx] = useState(0);
  const [p2HeadPx, setP2HeadPx] = useState(0);
  const [p2HeroPx, setP2HeroPx] = useState(0);

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

  // Spread view (magazine only): lay the sheets two-up like an open magazine so
  // the cover and its facing page read together. View-only — pagination, pt/mm
  // sizes and the PDF are untouched.
  const [spread, setSpread] = useState(false);
  const spreadOn = isMag && spread;
  const cols = spreadOn ? 2 : 1;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth - 40; // .paper-scroll padding (20px each side)
      const contentW = cols * PAGE_W_PX + (cols - 1) * PAGE_GAP_PX;
      setFitScale(clamp(avail / contentW, 0.25, 1)); // cap 1: fit only shrinks
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols]);

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
    // magazine-2: sheet 1's body box is narrower (the photo strip takes the right
    // edge) and shorter (head above, quote + highlights below), so it measures
    // against its own host. Sheet 2 is photo only — the spill resumes on sheet 3
    // in the plain full-width box, which is exactly what host2 already models.
    if (isSplit) {
      const sh1 = splitHost1Ref.current;
      const mh2 = magHost2Ref.current;
      if (!sh1 || !mh2) return;
      const head = splitHeadRef.current?.offsetHeight ?? 0;
      setSplitHeadPx(head);
      const root = sh1.closest<HTMLElement>('.measure-root');
      if (root) {
        root.style.setProperty('--footer-h', '10mm');
        root.style.setProperty('--mag2-head-h', `${head}px`);
      }
      // The quote + highlights are the flow's last atom, one column wide, so the
      // text fills column 1 and the box closes with them at the foot of column 2.
      // Measured at its real render width, exactly like the paper hl-col box.
      const aside = splitAsideRef.current;
      let flow = items;
      if (aside && (doc.meta.pullQuote || doc.highlights.some((h) => h.trim()))) {
        const w = aside.offsetWidth || 1;
        flow = [
          ...items,
          { kind: 'figure', id: MAG2_ASIDE_ID, aspect: aside.offsetHeight / w, hasCaption: false, full: false },
        ];
      }
      setPagination(paginate(sh1, mh2, flow));
      return;
    }

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
      // Highlights close the article as a full-width band, riding the flow's tail
      // as one atomic full-span item — same trick paper uses for 'below'.
      let magFlow = items;
      const magHl = hlBelow ? hlRef.current : null;
      if (magHl) {
        const w = magHl.offsetWidth || 1;
        magFlow = [
          ...items,
          { kind: 'figure', id: HIGHLIGHTS_BLOCK_ID, aspect: magHl.offsetHeight / w, hasCaption: false, full: true },
        ];
      }
      setPagination(paginate(mh1, mh2, magFlow));
      return;
    }

    // paper-2: the header and the hero block are the two things that push the
    // regions down, and neither depends on the flow — measure them off the real
    // sheet, feed the twins, then break the text across [left, right, page 2+].
    if (isP2) {
      const hl = p2HostLRef.current;
      const hr = p2HostRRef.current;
      const h2p = host2Ref.current;
      if (!hl || !hr || !h2p) return;

      const headH = scroll.querySelector<HTMLElement>('.p2-head')?.offsetHeight ?? 0;
      const heroH = scroll.querySelector<HTMLElement>('.p2-heroblock')?.offsetHeight ?? 0;
      setP2HeadPx(headH);
      setP2HeroPx(heroH);

      const root = hl.closest<HTMLElement>('.measure-root');
      if (root) {
        root.style.setProperty('--p2-head-h', `${headH}px`);
        root.style.setProperty('--p2-heroblock-h', `${heroH}px`);
        root.style.setProperty('--footer-h', '10mm');
      }

      // The in-flow highlights box is measured at the width of whichever region
      // can hold it — the right one, which is where the article ends.
      let p2flow = items;
      const p2hl = hlFlow ? hlColRef.current : hlBelow ? hlRef.current : null;
      if (p2hl) {
        const w = p2hl.offsetWidth || 1;
        p2flow = [
          ...items,
          { kind: 'figure', id: HIGHLIGHTS_BLOCK_ID, aspect: p2hl.offsetHeight / w, hasCaption: false, full: hlBelow },
        ];
      }
      setPagination(paginateHosts([hl, hr, h2p], p2flow));
      return;
    }

    // paper-3: three boxes, because the band costs sheet 1 (band + header),
    // sheet 2 (band) and sheets 3+ (nothing) different amounts of height.
    if (isP3) {
      const ph1 = p3Host1Ref.current;
      const ph2 = p3Host2Ref.current;
      const ph3 = host2Ref.current;
      if (!ph1 || !ph2 || !ph3) return;

      const headH = scroll.querySelector<HTMLElement>('.p3-head')?.offsetHeight ?? 0;
      setHeaderPx(headH);

      const root = ph1.closest<HTMLElement>('.measure-root');
      if (root) {
        root.style.setProperty('--header-h', `${headH}px`);
        root.style.setProperty('--footer-h', '10mm');
      }

      let p3flow = items;
      const p3hl = hlFlow ? hlColRef.current : hlBelow ? hlRef.current : null;
      if (p3hl) {
        const w = p3hl.offsetWidth || 1;
        p3flow = [
          ...items,
          { kind: 'figure', id: HIGHLIGHTS_BLOCK_ID, aspect: p3hl.offsetHeight / w, hasCaption: false, full: hlBelow },
        ];
      }
      setPagination(paginateHosts([ph1, ph2, ph3], p3flow));
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
  }, [baseVars, items, doc.meta, doc.design, doc.highlights, doc.references, hlBelow, hlFlow, isMag, isSplit, isP2, isP3]);

  const vars = {
    ...baseVars,
    '--header-h': `${headerPx}px`,
    '--footer-h': '10mm',
    '--mag-head-h': `${magHeadPx}px`,
    '--mag2-head-h': `${splitHeadPx}px`,
    '--mag2-strip': `${MAG2_STRIP}mm`,
    '--bar-h': '6mm',
    '--p2-head-h': `${p2HeadPx}px`,
    '--p2-heroblock-h': `${p2HeroPx}px`,
    '--p2-left-w': `${p2.leftW}mm`,
    '--p2-hero-w': `${p2.heroW}mm`,
    '--p2-right-w': `${p2.rightW}mm`,
    '--p2-cols-left': String(p2.headCols),
    '--p2-cols-right': String(p2.rightCols),
    '--p3-band-w': `${P3_BAND_W}mm`,
    '--p3-band-h': `${doc.design.heroHeight}mm`,
    // Absent = the wireframe's black rule with a grey tag block.
    '--bar-color': doc.design.barColor ?? '#111418',
    '--bar-tag': doc.design.barTagColor ?? '#bfbfbf',
    '--bar-ink': doc.design.barTagInk ?? '#111418',
  } as React.CSSProperties;

  // paper-2 spends two of paginateHosts' regions on sheet 1, so the fit badge
  // has to count sheets, not regions.
  const fit = fitMessage(isP2 ? paper2Fit(pagination) : pagination);
  const pages = pagination.pages;

  const scale = zoom === 'fit' ? fitScale : zoom;
  const pct = Math.round(scale * 100);
  // Magazine adds the cover sheet on top of the flowed content pages. magazine-2
  // instead puts the flow's first page ON sheet 1 and spends sheet 2 on the photo.
  const nPages = isSplit
    ? 2 + Math.max(0, pages.length - 1)
    : isMag
      ? 1 + pages.length
      : isP2
        ? 1 + Math.max(0, pages.length - 2)
        : Math.max(1, pages.length);
  const rows = Math.ceil(nPages / cols);
  const frame = {
    width: (cols * PAGE_W_PX + (cols - 1) * PAGE_GAP_PX) * scale,
    height: rows * (PAGE_H_PX + PAGE_GAP_PX) * scale,
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
        {isMag && (
          <div className="view-bar">
            <button
              type="button"
              className={`view-btn${spread ? ' is-active' : ''}`}
              onClick={() => setSpread((s) => !s)}
              title="Show as a side-by-side page spread"
              aria-pressed={spread}
            >
              <span className="view-btn-ico" aria-hidden="true">▭▭</span>
              Spread
            </button>
          </div>
        )}
        <div className="zoom-bar">
          <button
            type="button"
            className={`zoom-btn${zoom === 'fit' ? ' is-active' : ''}`}
            onClick={() => setZoom('fit')}
          >
            Fit
          </button>
          <button type="button" className="zoom-btn" onClick={() => step(-0.1)} title="Zoom out">
            −
          </button>
          <span className="zoom-val">{pct}%</span>
          <button type="button" className="zoom-btn" onClick={() => step(0.1)} title="Zoom in">
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
        <div
          className={`pages${spreadOn ? ' pages--spread' : ''}`}
          style={{ transform: `scale(${scale})` }}
        >
          {isSplit ? (
            <>
              <MagSplitCover doc={doc} vars={vars} pieces={pages[0] ?? []} />
              <MagPhotoPage doc={doc} vars={vars} />
              {pages.slice(1).map((pcs, i) => (
                <MagazinePage key={i} doc={doc} vars={vars} pieces={pcs} pageNo={i + 3} lead={false} />
              ))}
            </>
          ) : isMag ? (
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
          ) : isP3 ? (
            <>
              <PaperThreePage1 doc={doc} vars={vars} pieces={pages[0] ?? []} />
              {pages.length > 1 && <PaperThreePage2 doc={doc} vars={vars} pieces={pages[1]} />}
              {pages.slice(2).map((pcs, i) => (
                <PaperThreeCont key={i} doc={doc} vars={vars} pieces={pcs} pageNo={i + 3} />
              ))}
            </>
          ) : isP2 ? (
            <>
              <PaperTwoPage doc={doc} vars={vars} left={pages[0] ?? []} right={pages[1] ?? []} />
              {pages.slice(2).map((pcs, i) => (
                <ContPage key={i} doc={doc} vars={vars} pieces={pcs} pageNo={i + 2} />
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
        {isSplit ? (
          <>
            {/* Head + foot aside sized first (they set --mag2-head-h/--mag2-aside-h),
                then sheet 1's narrow host and the full-width sheet-3+ host. Both
                measure inside a .mag2-inner so they get the real article width. */}
            <div className="mag2-page">
              <div className="mag2-inner" style={{ height: 'auto' }}>
                <div ref={splitHeadRef}>
                  <MagSplitHead doc={doc} />
                </div>
                <div className="mag2-cols mag2-cols--p1" ref={splitHost1Ref} />
                {/* Measured at one column's width — the width it renders at
                    inside the flow, so its atom's height is the real one. */}
                <div style={{ width: 'var(--mag2-col)' }}>
                  <div ref={splitAsideRef}>
                    <MagSplitAside doc={doc} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mag-cols mag-cols--p2" ref={magHost2Ref} />
          </>
        ) : isMag ? (
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
        {/* paper-2's two sheet-1 regions. Heights come from --p2-head-h /
            --p2-heroblock-h, set from the real sheet just before the break. */}
        {isP2 && (
          <>
            <div className="body-cols p2-host-l" ref={p2HostLRef} />
            <div className={`body-cols p2-host-r${railed}`} ref={p2HostRRef} />
          </>
        )}
        {/* paper-3's sheet 1 (band + header) and sheet 2 (band). Sheets 3+ have
            no band, which is exactly the plain host2 box below. */}
        {isP3 && (
          <>
            <div className={`body-cols p3-host-1${railed}`} ref={p3Host1Ref} />
            <div className={`body-cols p3-host-2${railedEvery}`} ref={p3Host2Ref} />
          </>
        )}
        <div className="page">
          <div className={`body-cols body-cols--p1${railed}`} ref={host1Ref} />
        </div>
        <div className="page">
          <div className={`body-cols body-cols--p2${railedEvery}`} ref={host2Ref} />
        </div>
        {/* Below-article highlights: measured at body width to size its atom.
            Magazine's band spans its own content width, not the paper --body-1. */}
        {hlBelow && (
          <div style={{ width: isMag ? 'calc(var(--page-w) - 2 * var(--margin))' : 'var(--body-1)' }}>
            <aside className="hl-below" ref={hlRef}>
              <HighlightsBody doc={doc} hideRefs={doc.templateId === 'magazine-1'} />
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
