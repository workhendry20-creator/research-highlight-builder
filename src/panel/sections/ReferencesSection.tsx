import { useDoc } from '../../store/useDoc';
import { uid, type Reference } from '../../schema/document';
import { LabeledInput, RowButtons, Section } from '../Field';

export function ReferencesSection() {
  const references = useDoc((s) => s.doc.references);
  const update = useDoc((s) => s.update);

  const set = (i: number, key: keyof Reference) => (v: string) =>
    update((d) => {
      d.references[i][key] = v;
    });

  const remove = (i: number) =>
    update((d) => {
      d.references.splice(i, 1);
    });

  const add = () =>
    update((d) => {
      d.references.push({ id: uid(), authors: '', title: '', journal: '', year: '', doi: '' });
    });

  return (
    <Section title="References">
      {references.map((r, i) => (
        <div className="list-item list-item--stack" key={r.id}>
          <div className="list-item-head">
            <span className="list-item-num">[{i + 1}]</span>
            <RowButtons onRemove={() => remove(i)} />
          </div>
          <LabeledInput label="Penulis" value={r.authors} onChange={set(i, 'authors')} placeholder="Rahman, A. et al." />
          <LabeledInput label="Judul" value={r.title} onChange={set(i, 'title')} />
          <LabeledInput label="Jurnal" value={r.journal} onChange={set(i, 'journal')} placeholder="Nature Photonics" />
          <LabeledInput label="Tahun" value={r.year} onChange={set(i, 'year')} placeholder="2025" />
          <LabeledInput label="DOI" value={r.doi} onChange={set(i, 'doi')} placeholder="10.1038/…" />
        </div>
      ))}
      <button type="button" className="add-btn" onClick={add}>
        + Tambah referensi
      </button>
    </Section>
  );
}
