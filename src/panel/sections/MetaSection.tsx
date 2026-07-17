import { useDoc } from '../../store/useDoc';
import { familyOf } from '../../schema/document';
import { LabeledInput, LabeledTextarea, Section } from '../Field';

export function MetaSection() {
  const meta = useDoc((s) => s.doc.meta);
  const isMag = useDoc((s) => familyOf(s.doc.templateId) === 'magazine');
  const isP2 = useDoc((s) => s.doc.templateId === 'paper-2');
  // paper-3 draws the same tag bar, and captions its own hero band.
  const hasBar = useDoc((s) => s.doc.templateId === 'paper-2' || s.doc.templateId === 'paper-3');
  const update = useDoc((s) => s.update);

  const set = (key: keyof typeof meta) => (v: string) =>
    update((d) => {
      d.meta[key] = v;
    });

  return (
    <Section title="Judul & Penulis">
      <LabeledInput
        label={isMag ? 'Kicker' : 'Kategori'}
        value={meta.categoryLabel}
        onChange={set('categoryLabel')}
        placeholder={isMag ? 'LAPORAN UTAMA' : 'Research Highlight · Physics'}
      />
      <LabeledInput label="Judul" value={meta.title} onChange={set('title')} placeholder="Judul highlight" />
      <LabeledInput
        label={isMag ? 'Lede (subjudul cover)' : 'Subjudul'}
        value={meta.subtitle}
        onChange={set('subtitle')}
        placeholder="Satu kalimat penjelas"
      />
      <LabeledInput label="Penulis" value={meta.author} onChange={set('author')} placeholder="A. Rahman, S. Tan" />
      <LabeledInput
        label={isMag ? 'Afiliasi / Rubrik' : 'Afiliasi'}
        value={meta.affiliation}
        onChange={set('affiliation')}
        placeholder="School of Physics, USM"
      />

      {hasBar && (
        <>
          <p className="group-label">Bar atas</p>
          <LabeledInput
            label="Teks bar atas"
            value={meta.masthead ?? ''}
            onChange={set('masthead')}
            placeholder="School of Physics"
          />
          {isP2 && (
            <LabeledInput
              label="Caption hero"
              value={meta.heroCaption ?? ''}
              onChange={set('heroCaption')}
              placeholder="Keterangan gambar hero"
            />
          )}
        </>
      )}

      {isMag && (
        <>
          <p className="group-label">Elemen Majalah</p>
          <LabeledInput label="Masthead" value={meta.masthead ?? ''} onChange={set('masthead')} placeholder="KUANTA" />
          <LabeledInput
            label="Volume / Tanggal"
            value={meta.volume ?? ''}
            onChange={set('volume')}
            placeholder="VOL. IX · NO.2 · MARET 2026"
          />
          <LabeledInput
            label="Lokasi (tag foto)"
            value={meta.location ?? ''}
            onChange={set('location')}
            placeholder="OBSERVATORIUM MAUNA · 4.200 MDPL"
          />
          <LabeledInput
            label="Kredit foto"
            value={meta.photoCredit ?? ''}
            onChange={set('photoCredit')}
            placeholder="L. HAKIM"
          />
          <LabeledTextarea
            label="Kutipan (pull-quote)"
            value={meta.pullQuote ?? ''}
            onChange={set('pullQuote')}
            placeholder="Kalimat kutipan besar di tengah spread…"
          />
          <LabeledInput
            label="Atribusi kutipan"
            value={meta.pullQuoteBy ?? ''}
            onChange={set('pullQuoteBy')}
            placeholder="— DR. ARIA PRATAMA, FEB 2026"
          />
        </>
      )}
    </Section>
  );
}
