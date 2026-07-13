import { useDoc } from '../../store/useDoc';
import { LabeledInput, Section } from '../Field';

export function MetaSection() {
  const meta = useDoc((s) => s.doc.meta);
  const update = useDoc((s) => s.update);

  const set = (key: keyof typeof meta) => (v: string) =>
    update((d) => {
      d.meta[key] = v;
    });

  return (
    <Section title="Judul & Penulis">
      <LabeledInput label="Kategori" value={meta.categoryLabel} onChange={set('categoryLabel')} placeholder="Research Highlight · Physics" />
      <LabeledInput label="Judul" value={meta.title} onChange={set('title')} placeholder="Judul highlight" />
      <LabeledInput label="Subjudul" value={meta.subtitle} onChange={set('subtitle')} placeholder="Satu kalimat penjelas" />
      <LabeledInput label="Penulis" value={meta.author} onChange={set('author')} placeholder="A. Rahman, S. Tan" />
      <LabeledInput label="Afiliasi" value={meta.affiliation} onChange={set('affiliation')} placeholder="School of Physics, USM" />
    </Section>
  );
}
