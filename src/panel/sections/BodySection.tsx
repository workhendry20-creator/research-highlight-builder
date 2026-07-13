import { useRef, useState } from 'react';
import { useDoc } from '../../store/useDoc';
import { uid, type Doc } from '../../schema/document';
import { RowButtons, Section, SegmentField } from '../Field';

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

  const setSpan = (i: number, span: 1 | 'body') =>
    update((d) => {
      const b = d.blocks[i];
      if (b.type === 'figure') b.span = span;
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
        d.blocks.push({ id: uid(), type: 'figure', assetId: aid, caption: '', span: 'body' });
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
              className="field-input field-textarea"
              value={b.text}
              rows={5}
              placeholder="Tulis paragraf…"
              onChange={(e) => setText(i, e.target.value)}
            />
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
              <SegmentField<1 | 'body'>
                label="Ukuran"
                value={b.span}
                options={[
                  { value: 1, label: '1 kolom' },
                  { value: 'body', label: 'Selebar' },
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
      </div>
    </Section>
  );
}
