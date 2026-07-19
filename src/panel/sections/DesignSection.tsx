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

const SERIF_FONTS = ['Source Serif 4', 'Playfair Display', 'Avenir Next', 'Georgia', 'Times New Roman', 'Palatino'];
const SANS_FONTS = ['Source Sans 3', 'Playfair Display', 'Helvetica', 'Arial', 'Verdana', 'system-ui'];
// Per-element font pickers can use any family, serif or sans.
const ALL_FONTS = [...new Set([...SERIF_FONTS, ...SANS_FONTS])];
const asOptions = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

export function DesignSection() {
  const design = useDoc((s) => s.doc.design);
  const hasBar = useDoc((s) => s.doc.templateId === 'paper-2' || s.doc.templateId === 'paper-3');
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
    <Section title="Design">
      <p className="group-label">Layout</p>
      <SegmentField<Design['bodyCols']>
        label="Body columns"
        value={design.bodyCols}
        options={[
          { value: 2, label: '2' },
          { value: 3, label: '3' },
          { value: 4, label: '4' },
        ]}
        onChange={(v) => set('bodyCols', v)}
      />
      <SegmentField<NonNullable<Design['bodyAlign']>>
        label="Text align"
        value={design.bodyAlign ?? 'justify'}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
          { value: 'justify', label: 'Justify' },
        ]}
        onChange={(v) => set('bodyAlign', v)}
      />
      <Toggle
        label="Show highlights"
        checked={design.sidebar}
        onChange={(v) => set('sidebar', v)}
      />
      {design.sidebar && (
        <LabeledSelect
          label="Highlights position"
          value={design.highlightsPlacement ?? 'page1'}
          options={[
            { value: 'page1', label: 'Right sidebar (page 1)' },
            { value: 'page1-flow', label: 'Right sidebar + text fills the gap (page 1)' },
            { value: 'all', label: 'Right sidebar (every page)' },
            { value: 'below', label: 'Below the text (end)' },
          ]}
          onChange={(v) => set('highlightsPlacement', v as Design['highlightsPlacement'])}
        />
      )}
      {cpl && <p className="hint hint--warn">{cpl}</p>}

      <p className="group-label">Spacing (mm)</p>
      <LabeledNumber label="Margin" unit="mm" value={design.margin} min={8} max={30} step={1} onChange={(v) => set('margin', v)} />
      <LabeledNumber label="Gutter" unit="mm" value={design.gutter} min={2} max={12} step={0.5} onChange={(v) => set('gutter', v)} />

      <p className="group-label">Font sizes (pt)</p>
      <LabeledNumber label="Title" unit="pt" value={design.sizes.title} min={16} max={48} step={0.5} onChange={setSize('title')} />
      <LabeledNumber label="Subtitle" unit="pt" value={design.sizes.subtitle} min={8} max={18} step={0.5} onChange={setSize('subtitle')} />
      <LabeledNumber label="Body" unit="pt" value={design.sizes.body} min={7} max={12} step={0.1} onChange={setSize('body')} />
      <LabeledNumber label="Category" unit="pt" value={design.sizes.categoryLabel} min={6} max={12} step={0.5} onChange={setSize('categoryLabel')} />
      <LabeledNumber label="Author" unit="pt" value={design.sizes.author} min={7} max={12} step={0.5} onChange={setSize('author')} />
      <LabeledNumber label="Affiliation" unit="pt" value={design.sizes.affiliation} min={7} max={12} step={0.5} onChange={setSize('affiliation')} />

      <p className="group-label">Fonts</p>
      <LabeledSelect label="Display" value={design.fontDisplay} options={asOptions(SERIF_FONTS)} onChange={(v) => set('fontDisplay', v)} />
      <LabeledSelect label="Body" value={design.fontBody} options={asOptions(SANS_FONTS)} onChange={(v) => set('fontBody', v)} />
      <LabeledSelect label="Category" value={design.fontCategory ?? design.fontBody} options={asOptions(ALL_FONTS)} onChange={(v) => set('fontCategory', v)} />
      <LabeledSelect label="Subtitle" value={design.fontSubtitle ?? design.fontDisplay} options={asOptions(ALL_FONTS)} onChange={(v) => set('fontSubtitle', v)} />
      <LabeledSelect label="Author" value={design.fontAuthor ?? design.fontBody} options={asOptions(ALL_FONTS)} onChange={(v) => set('fontAuthor', v)} />
      <LabeledSelect label="Affiliation" value={design.fontAffiliation ?? design.fontBody} options={asOptions(ALL_FONTS)} onChange={(v) => set('fontAffiliation', v)} />

      <p className="group-label">Colors</p>
      <LabeledColor label="Hero" value={design.colors.hero} onChange={setColor('hero')} />
      <LabeledColor label="Accent" value={design.colors.accent} onChange={setColor('accent')} />
      <LabeledColor label="Accent soft" value={design.colors.accentSoft} onChange={setColor('accentSoft')} />
      <LabeledColor label="Ink (text)" value={design.colors.ink} onChange={setColor('ink')} />

      {hasBar && (
        <>
          <p className="group-label">Top bar</p>
          <LabeledColor label="Bar rule" value={design.barColor ?? '#111418'} onChange={(v) => set('barColor', v)} />
          <LabeledColor label="Tag box" value={design.barTagColor ?? '#bfbfbf'} onChange={(v) => set('barTagColor', v)} />
          <LabeledColor label="Bar text ink" value={design.barTagInk ?? '#111418'} onChange={(v) => set('barTagInk', v)} />
        </>
      )}

      <p className="group-label">Custom CSS</p>
      <LabeledTextarea
        label="Injected into the preview as-is"
        value={design.customCss}
        onChange={(v) => set('customCss', v)}
        placeholder=".title { letter-spacing: -0.02em; }"
      />
    </Section>
  );
}
