import { useDoc } from '../../store/useDoc';
import type { Design } from '../../schema/document';
import { cplWarning } from '../../lib/geometry';
import {
  LabeledColor,
  LabeledNumber,
  LabeledSelect,
  LabeledTextarea,
  SegmentField,
  Section,
  Toggle,
} from '../Field';

const SERIF_FONTS = ['Source Serif 4', 'Georgia', 'Times New Roman', 'Palatino'];
const SANS_FONTS = ['Source Sans 3', 'Helvetica', 'Arial', 'Verdana', 'system-ui'];
const asOptions = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

export function DesignSection() {
  const design = useDoc((s) => s.doc.design);
  const update = useDoc((s) => s.update);

  const set = <K extends keyof Design>(key: K, value: Design[K]) =>
    update((d) => {
      d.design[key] = value;
    });

  const setSize = (key: keyof Design['sizes']) => (v: number) =>
    update((d) => {
      d.design.sizes[key] = v;
    });

  const setColor = (key: keyof Design['colors']) => (v: string) =>
    update((d) => {
      d.design.colors[key] = v;
    });

  const cpl = cplWarning(design);

  return (
    <Section title="Desain">
      <p className="group-label">Tata letak</p>
      <SegmentField<Design['bodyCols']>
        label="Kolom body"
        value={design.bodyCols}
        options={[
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
        ]}
        onChange={(v) => set('bodyCols', v)}
      />
      <Toggle
        label="Tampilkan highlights"
        checked={design.sidebar}
        onChange={(v) => set('sidebar', v)}
      />
      {design.sidebar && (
        <LabeledSelect
          label="Posisi highlights"
          value={design.highlightsPlacement ?? 'page1'}
          options={[
            { value: 'page1', label: 'Sidebar kanan (hal. 1)' },
            { value: 'page1-flow', label: 'Sidebar kanan + teks isi celah (hal. 1)' },
            { value: 'all', label: 'Sidebar kanan (tiap hal.)' },
            { value: 'below', label: 'Di bawah teks (akhir)' },
          ]}
          onChange={(v) => set('highlightsPlacement', v as Design['highlightsPlacement'])}
        />
      )}
      {cpl && <p className="hint hint--warn">{cpl}</p>}

      <p className="group-label">Spasi (mm)</p>
      <LabeledNumber label="Margin" unit="mm" value={design.margin} min={8} max={30} step={1} onChange={(v) => set('margin', v)} />
      <LabeledNumber label="Gutter" unit="mm" value={design.gutter} min={2} max={12} step={0.5} onChange={(v) => set('gutter', v)} />

      <p className="group-label">Ukuran huruf (pt)</p>
      <LabeledNumber label="Judul" unit="pt" value={design.sizes.title} min={16} max={48} step={0.5} onChange={setSize('title')} />
      <LabeledNumber label="Subjudul" unit="pt" value={design.sizes.subtitle} min={8} max={18} step={0.5} onChange={setSize('subtitle')} />
      <LabeledNumber label="Body" unit="pt" value={design.sizes.body} min={7} max={12} step={0.1} onChange={setSize('body')} />
      <LabeledNumber label="Kategori" unit="pt" value={design.sizes.categoryLabel} min={6} max={12} step={0.5} onChange={setSize('categoryLabel')} />
      <LabeledNumber label="Penulis" unit="pt" value={design.sizes.author} min={7} max={12} step={0.5} onChange={setSize('author')} />
      <LabeledNumber label="Afiliasi" unit="pt" value={design.sizes.affiliation} min={7} max={12} step={0.5} onChange={setSize('affiliation')} />

      <p className="group-label">Huruf</p>
      <LabeledSelect label="Display" value={design.fontDisplay} options={asOptions(SERIF_FONTS)} onChange={(v) => set('fontDisplay', v)} />
      <LabeledSelect label="Body" value={design.fontBody} options={asOptions(SANS_FONTS)} onChange={(v) => set('fontBody', v)} />

      <p className="group-label">Warna</p>
      <LabeledColor label="Hero" value={design.colors.hero} onChange={setColor('hero')} />
      <LabeledColor label="Aksen" value={design.colors.accent} onChange={setColor('accent')} />
      <LabeledColor label="Aksen lembut" value={design.colors.accentSoft} onChange={setColor('accentSoft')} />
      <LabeledColor label="Tinta (teks)" value={design.colors.ink} onChange={setColor('ink')} />

      <p className="group-label">CSS kustom</p>
      <LabeledTextarea
        label="Disuntik ke preview apa adanya"
        value={design.customCss}
        onChange={(v) => set('customCss', v)}
        placeholder=".title { letter-spacing: -0.02em; }"
      />
    </Section>
  );
}
