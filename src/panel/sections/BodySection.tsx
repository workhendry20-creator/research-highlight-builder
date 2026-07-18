import { useCallback, useRef, useState } from 'react';
import { useDoc } from '../../store/useDoc';
import { uid, type Doc } from '../../schema/document';
import { RowButtons, Section, SegmentField, Toggle } from '../Field';
import { TOKEN, wrapSelection, renderTex, type Mark } from '../../lib/richtext';
import { setActiveEditor } from '../../lib/activeEditor';

const KEY_TO_MARK: Record<string, Mark> = { b: 'b', i: 'i', u: 'u' };

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

const stillUsed = (d: Doc, assetId: string) =>
  d.blocks.some((b) => b.type === 'figure' && b.assetId === assetId) || d.hero.assetId === assetId;

export function BodySection() {
  const blocks = useDoc((s) => s.doc.blocks);
  const assets = useDoc((s) => s.doc.assets);
  const update = useDoc((s) => s.update);
  // Ref, not state: the drop handler must read the source index synchronously,
  // without waiting for a re-render between dragstart and drop.
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Grow the writing box to its content so paragraphs never type into a small
  // inner-scrolling area. Stable identity: runs on mount (initial + tab switch).
  const autosize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const setText = (i: number, text: string) =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'paragraph') b.text = text;
    });

  const setCaption = (i: number, caption: string) =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'figure') b.caption = caption;
    });

  const setSpan = (i: number, span: 1 | 'body' | 'bleed') =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'figure') b.span = span;
    });

  const setAlign = (i: number, align: 'left' | 'center' | 'right') =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'figure') b.align = align;
    });

  const remove = (i: number) =>
    update((d) => {
      const [b] = d.blocks.splice(i, 1);
      if (b.type === 'figure' && !stillUsed(d, b.assetId)) delete d.assets[b.assetId];
    });

  const swap = (i: number, j: number) =>
    update((d) => {
      if (j < 0 || j >= d.blocks.length) return;
      [d.blocks[i], d.blocks[j]] = [d.blocks[j], d.blocks[i]];
    });

  const move = (from: number, to: number) =>
    update((d) => {
      if (from === to || to < 0 || to >= d.blocks.length) return;
      const [b] = d.blocks.splice(from, 1);
      d.blocks.splice(to, 0, b);
    });

  const addParagraph = () =>
    update((d) => {
      d.blocks.push({ id: uid(), type: 'paragraph', text: '' });
    });

  const addEquation = () =>
    update((d) => {
      d.blocks.push({ id: uid(), type: 'equation', latex: '', numbered: false });
    });

  const setLatex = (i: number, latex: string) =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'equation') b.latex = latex;
    });

  const setNumbered = (i: number, numbered: boolean) =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'equation') b.numbered = numbered;
    });

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

  const addImage = () =>
    pickImage((file) =>
      readAsset(file, (aid, d) => {
        d.blocks.push({ id: uid(), type: 'figure', assetId: aid, caption: '', span: 'body', align: 'left' });
      }),
    );

  const replaceImage = (i: number) =>
    pickImage((file) =>
      readAsset(file, (aid, d) => {
        const b = d.blocks[i];
        if (b.type !== 'figure') return;
        const old = b.assetId;
        b.assetId = aid;
        if (!stillUsed(d, old)) delete d.assets[old];
      }),
    );

  const onDrop = (to: number) => {
    if (dragFrom.current !== null) move(dragFrom.current, to);
    dragFrom.current = null;
    setDragOver(null);
  };

  return (
    <Section title="Isi (paragraf & gambar)">
      {blocks.map((b, i) => (
        <div
          key={b.id}
          className={`list-item${b.type === 'figure' ? ' list-item--stack' : ''}${
            dragOver === i ? ' is-drop' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOver !== i) setDragOver(i);
          }}
          onDrop={() => onDrop(i)}
        >
          <span
            className="drag-handle"
            title="Seret untuk mengurut"
            draggable
            onDragStart={() => (dragFrom.current = i)}
            onDragEnd={() => {
              dragFrom.current = null;
              setDragOver(null);
            }}
          >
            ⠿
          </span>

          {b.type === 'paragraph' ? (
            <textarea
              ref={autosize}
              className="field-input field-textarea field-textarea--grow"
              value={b.text}
              rows={2}
              placeholder="Tulis paragraf…"
              onFocus={(e) =>
                setActiveEditor({ el: e.currentTarget, setValue: (v) => setText(i, v) })
              }
              onKeyDown={(e) => {
                // Ctrl/⌘ + B / I / U — Word-style inline formatting; +M — $…$ math.
                if (!(e.metaKey || e.ctrlKey)) return;
                const key = e.key.toLowerCase();
                if (key === 'm') {
                  e.preventDefault();
                  wrapSelection(e.currentTarget, '$', (v) => setText(i, v));
                  return;
                }
                const mark = KEY_TO_MARK[key];
                if (!mark) return;
                e.preventDefault();
                wrapSelection(e.currentTarget, TOKEN[mark], (v) => setText(i, v));
              }}
              onChange={(e) => {
                setText(i, e.target.value);
                autosize(e.currentTarget);
              }}
            />
          ) : b.type === 'equation' ? (
            <div className="equation-edit">
              <textarea
                ref={autosize}
                className="field-input field-textarea field-textarea--grow field-mono"
                value={b.latex}
                rows={2}
                placeholder="LaTeX, e.g. \hbar\omega = \frac{p^2}{2m}"
                onChange={(e) => {
                  setLatex(i, e.target.value);
                  autosize(e.currentTarget);
                }}
              />
              <div
                className="equation-preview"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: renderTex(b.latex || '\\;', true) }}
              />
              <Toggle label="Number it" checked={b.numbered ?? false} onChange={(v) => setNumbered(i, v)} />
            </div>
          ) : (
            <div className="figure-edit">
              <div className="figure-thumb">
                {assets[b.assetId] ? (
                  <img src={assets[b.assetId].src} alt="" />
                ) : (
                  <span className="figure-missing">Gambar hilang</span>
                )}
              </div>
              <input
                className="field-input"
                value={b.caption}
                placeholder="Keterangan gambar (caption)…"
                onChange={(e) => setCaption(i, e.target.value)}
              />
              <SegmentField<'left' | 'center' | 'right'>
                label="Rata caption"
                value={b.align ?? 'left'}
                options={[
                  { value: 'left', label: 'Kiri' },
                  { value: 'center', label: 'Tengah' },
                  { value: 'right', label: 'Kanan' },
                ]}
                onChange={(v) => setAlign(i, v)}
              />
              <SegmentField<1 | 'body' | 'bleed'>
                label="Ukuran"
                value={b.span}
                options={[
                  { value: 1, label: '1 kolom' },
                  { value: 'body', label: 'Selebar' },
                  { value: 'bleed', label: 'Tepi kertas' },
                ]}
                onChange={(v) => setSpan(i, v)}
              />
              <button type="button" className="add-btn" onClick={() => replaceImage(i)}>
                Ganti gambar
              </button>
            </div>
          )}

          <RowButtons
            onUp={() => swap(i, i - 1)}
            onDown={() => swap(i, i + 1)}
            onRemove={() => remove(i)}
            disableUp={i === 0}
            disableDown={i === blocks.length - 1}
          />
        </div>
      ))}

      <div className="add-row">
        <button type="button" className="add-btn" onClick={addParagraph}>
          + Paragraf
        </button>
        <button type="button" className="add-btn" onClick={addImage}>
          + Gambar
        </button>
        <button type="button" className="add-btn" onClick={addEquation}>
          + Formula
        </button>
      </div>

      <p className="hint">
        Inline formula: wrap LaTeX in <code>$…$</code> — e.g.{' '}
        <code>$E = mc^2$</code> (select text then ⌘/Ctrl+M). Standalone formula:{' '}
        <strong>+ Formula</strong>.
      </p>
    </Section>
  );
}
