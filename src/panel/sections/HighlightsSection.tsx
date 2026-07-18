import { useDoc } from '../../store/useDoc';
import { RowButtons, Section } from '../Field';

export function HighlightsSection() {
  const highlights = useDoc((s) => s.doc.highlights);
  const update = useDoc((s) => s.update);

  const set = (i: number, v: string) =>
    update((d) => {
      d.highlights[i] = v;
    });

  const remove = (i: number) =>
    update((d) => {
      d.highlights.splice(i, 1);
    });

  const add = () =>
    update((d) => {
      d.highlights.push('');
    });

  return (
    <Section title="Highlights">
      {highlights.map((h, i) => (
        // Plain strings have no id; index key is acceptable until reorder lands.
        <div className="list-item" key={i}>
          <textarea
            className="field-input field-textarea"
            value={h}
            rows={2}
            placeholder={`Highlight ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
          />
          <RowButtons onRemove={() => remove(i)} />
        </div>
      ))}
      <button type="button" className="add-btn" onClick={add}>
        + Add highlight
      </button>
    </Section>
  );
}
