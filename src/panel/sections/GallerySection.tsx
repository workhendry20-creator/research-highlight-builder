import { useDoc } from '../../store/useDoc';
import { uid, type Doc } from '../../schema/document';
import { LabeledColor, LabeledRange, Section } from '../Field';

const DEFAULT_FRAME = { scale: 1, offsetX: 0, offsetY: 0 };

/** Per-template image slots, in the order figures fill them, plus which slot is
 *  the fold image (spans both pages — its framing is locked so the two halves
 *  stay joined). Slot i edits the i-th figure block. */
type Layout = { fold: number; slots: { label: string; hint: string }[] };
const LAYOUTS: Record<string, Layout> = {
  'gallery-1': {
    fold: 1,
    slots: [
      { label: 'Image 1', hint: 'Page 1 · top-left' },
      { label: 'Image 2', hint: 'Fold · spans page 1 → page 2' },
      { label: 'Image 3', hint: 'Page 1 · bottom-right' },
      { label: 'Image 4', hint: 'Page 2 · mid-right' },
      { label: 'Image 5', hint: 'Page 2 · bottom-left' },
    ],
  },
  'gallery-2': {
    fold: 0,
    slots: [
      { label: 'Image 1', hint: 'Fold · vertical, spans page 1 → page 2' },
      { label: 'Image 2', hint: 'Page 1 · top-left' },
      { label: 'Image 3', hint: 'Page 1 · mid-left' },
      { label: 'Image 4', hint: 'Page 1 · bottom-left' },
      { label: 'Image 5', hint: 'Page 2 · top-right' },
      { label: 'Image 6', hint: 'Page 2 · mid-right' },
      { label: 'Image 7', hint: 'Page 2 · bottom-right' },
    ],
  },
};

/** Caption is stored as "**Title**\nDescription"; expose it as two fields. */
function splitCaption(caption: string): { title: string; desc: string } {
  const nl = caption.indexOf('\n');
  const head = nl === -1 ? caption : caption.slice(0, nl);
  const desc = nl === -1 ? '' : caption.slice(nl + 1);
  const title = head.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
  return { title, desc };
}
function joinCaption(title: string, desc: string): string {
  if (!title && !desc) return '';
  return `${title ? `**${title}**` : ''}\n${desc}`;
}

/** Open a native file picker without a persistent <input> in the tree. */
function pickImage(onPick: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) onPick(f);
  };
  input.click();
}

export function GallerySection() {
  const blocks = useDoc((s) => s.doc.blocks);
  const assets = useDoc((s) => s.doc.assets);
  const paperBg = useDoc((s) => s.doc.design.paperBg ?? '#ffffff');
  const templateId = useDoc((s) => s.doc.templateId ?? 'gallery-1');
  const update = useDoc((s) => s.update);

  const layout = LAYOUTS[templateId] ?? LAYOUTS['gallery-1'];
  const SLOTS = layout.slots;
  const FOLD_SLOT = layout.fold;

  const setPaperBg = (v: string) =>
    update((d) => {
      d.design.paperBg = v;
    });

  // The block index of each figure, in order → figIndex[n] is slot n's block.
  const figIndex = blocks.reduce<number[]>((acc, b, i) => {
    if (b.type === 'figure') acc.push(i);
    return acc;
  }, []);

  const readAsset = (file: File, then: (aid: string, d: Doc) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () =>
        update((d) => {
          const aid = uid();
          d.assets[aid] = { src, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
          then(aid, d);
        });
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const stillUsed = (d: Doc, assetId: string) =>
    d.blocks.some((b) => b.type === 'figure' && b.assetId === assetId) || d.hero.assetId === assetId;

  const setImage = (slot: number) =>
    pickImage((file) =>
      readAsset(file, (aid, d) => {
        const bi = d.blocks.reduce<number[]>((a, b, i) => (b.type === 'figure' ? [...a, i] : a), [])[slot];
        if (bi === undefined) {
          // No figure for this slot yet — create one so the layout fills.
          d.blocks.push({ id: uid(), type: 'figure', assetId: aid, caption: '', span: 1 });
        } else {
          const b = d.blocks[bi];
          if (b.type !== 'figure') return;
          const old = b.assetId;
          b.assetId = aid;
          if (!stillUsed(d, old)) delete d.assets[old];
        }
      }),
    );

  const setCaption = (blockIdx: number, caption: string) =>
    update((d) => {
      const b = d.blocks[blockIdx];
      if (b.type === 'figure') b.caption = caption;
    });

  const setFrame = (blockIdx: number, key: 'scale' | 'offsetX' | 'offsetY') => (v: number) =>
    update((d) => {
      const b = d.blocks[blockIdx];
      if (b.type !== 'figure') return;
      b.frame = { ...DEFAULT_FRAME, ...b.frame, [key]: v };
    });

  return (
    <Section title="Gallery images">
      <LabeledColor label="Paper background" value={paperBg} onChange={setPaperBg} />
      <p className="gallery-slot-hint">Text flips to black on light sheets, white on dark.</p>
      {SLOTS.map((s, n) => {
        const bi = figIndex[n];
        const block = bi === undefined ? undefined : blocks[bi];
        const asset = block && block.type === 'figure' ? assets[block.assetId] : undefined;
        const caption = block && block.type === 'figure' ? block.caption : '';
        const { title, desc } = splitCaption(caption);
        const frame = (block && block.type === 'figure' && block.frame) || DEFAULT_FRAME;
        const canFrame = bi !== undefined;
        const isFold = n === FOLD_SLOT;
        return (
          <div className="gallery-slot" key={s.label}>
            <div className="gallery-slot-head">
              <span className="gallery-slot-label">{s.label}</span>
              <span className="gallery-slot-hint">{s.hint}</span>
            </div>
            <div className="figure-thumb gallery-slot-thumb">
              {asset ? (
                <img
                  src={asset.src}
                  alt=""
                  style={{ transform: `translate(${frame.offsetX}%, ${frame.offsetY}%) scale(${frame.scale})` }}
                />
              ) : (
                <span className="figure-missing">No image</span>
              )}
            </div>
            <button type="button" className="add-btn" onClick={() => setImage(n)}>
              {asset ? 'Replace image' : `Upload ${s.label}`}
            </button>
            {bi !== undefined && (
              <>
                <input
                  className="field-input"
                  value={title}
                  placeholder="Title (bold)…"
                  onChange={(e) => setCaption(bi, joinCaption(e.target.value, desc))}
                />
                <textarea
                  className="field-input field-textarea"
                  value={desc}
                  rows={2}
                  placeholder="Description…"
                  onChange={(e) => setCaption(bi, joinCaption(title, e.target.value))}
                />
              </>
            )}
            {canFrame && (
              <>
                <LabeledRange label="Zoom" value={frame.scale} min={1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={setFrame(bi, 'scale')} />
                <LabeledRange label="Shift horizontally" value={frame.offsetX} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setFrame(bi, 'offsetX')} />
                <LabeledRange label="Shift vertically" value={frame.offsetY} min={-50} max={50} step={1} format={(v) => `${v}%`} onChange={setFrame(bi, 'offsetY')} />
              </>
            )}
            {isFold && (
              <p className="gallery-slot-hint">Zoom &amp; shift stay in sync across the fold.</p>
            )}
          </div>
        );
      })}
    </Section>
  );
}
