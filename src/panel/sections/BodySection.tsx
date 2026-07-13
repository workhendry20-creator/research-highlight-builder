import { useDoc } from '../../store/useDoc';
import { uid } from '../../schema/document';
import { RowButtons, Section } from '../Field';

export function BodySection() {
  const blocks = useDoc((s) => s.doc.blocks);
  const update = useDoc((s) => s.update);

  // Indices into doc.blocks that are paragraphs — figures stay untouched.
  const paras = blocks
    .map((b, i) => ({ b, i }))
    .filter((x): x is { b: Extract<typeof x.b, { type: 'paragraph' }>; i: number } => x.b.type === 'paragraph');

  const setText = (idx: number, text: string) =>
    update((d) => {
      const block = d.blocks[idx];
      if (block.type === 'paragraph') block.text = text;
    });

  const remove = (idx: number) =>
    update((d) => {
      d.blocks.splice(idx, 1);
    });

  const swap = (idx: number, other: number) =>
    update((d) => {
      [d.blocks[idx], d.blocks[other]] = [d.blocks[other], d.blocks[idx]];
    });

  const add = () =>
    update((d) => {
      d.blocks.push({ id: uid(), type: 'paragraph', text: '' });
    });

  return (
    <Section title="Isi (paragraf)">
      {paras.map(({ b, i }, pos) => (
        <div className="list-item" key={b.id}>
          <textarea
            className="field-input field-textarea"
            value={b.text}
            rows={5}
            placeholder={`Paragraf ${pos + 1}`}
            onChange={(e) => setText(i, e.target.value)}
          />
          <RowButtons
            onUp={() => swap(i, prevParaIndex(paras, pos))}
            onDown={() => swap(i, nextParaIndex(paras, pos))}
            onRemove={() => remove(i)}
            disableUp={pos === 0}
            disableDown={pos === paras.length - 1}
          />
        </div>
      ))}
      <button type="button" className="add-btn" onClick={add}>
        + Tambah paragraf
      </button>
    </Section>
  );
}

const prevParaIndex = (paras: { i: number }[], pos: number) => paras[Math.max(0, pos - 1)].i;
const nextParaIndex = (paras: { i: number }[], pos: number) =>
  paras[Math.min(paras.length - 1, pos + 1)].i;
