import { useDoc } from '../../store/useDoc';
import { familyOf } from '../../schema/document';
import { LabeledColor, LabeledInput, LabeledTextarea, Section } from '../Field';

export function MetaSection() {
  const meta = useDoc((s) => s.doc.meta);
  const isMag = useDoc((s) => familyOf(s.doc.templateId) === 'magazine');
  const isGallery = useDoc((s) => familyOf(s.doc.templateId) === 'gallery');
  const barColor = useDoc((s) => s.doc.design.colors.accent);
  const isP2 = useDoc((s) => s.doc.templateId === 'paper-2');
  // paper-3 draws the same tag bar, and captions its own hero band.
  const hasBar = useDoc((s) => s.doc.templateId === 'paper-2' || s.doc.templateId === 'paper-3');
  const update = useDoc((s) => s.update);

  const set = (key: keyof typeof meta) => (v: string) =>
    update((d) => {
      d.meta[key] = v;
    });

  const setBarColor = (v: string) =>
    update((d) => {
      d.design.colors.accent = v;
    });

  return (
    <Section title={isGallery ? 'Header' : 'Title & Author'}>
      {isGallery ? (
        <>
          <LabeledInput
            label="Header text"
            value={meta.masthead ?? ''}
            onChange={set('masthead')}
            placeholder="PHYSICS GALLERY"
          />
          <LabeledColor label="Bar color" value={barColor} onChange={setBarColor} />
        </>
      ) : (
        <>
          <LabeledInput
            label={isMag ? 'Kicker' : 'Category'}
            value={meta.categoryLabel}
            onChange={set('categoryLabel')}
            placeholder={isMag ? 'COVER STORY' : 'Research Highlight · Physics'}
          />
          <LabeledInput label="Title" value={meta.title} onChange={set('title')} placeholder="Highlight title" />
          <LabeledInput
            label={isMag ? 'Lede (cover subtitle)' : 'Subtitle'}
            value={meta.subtitle}
            onChange={set('subtitle')}
            placeholder="One explanatory sentence"
          />
          <LabeledInput label="Author" value={meta.author} onChange={set('author')} placeholder="A. Rahman, S. Tan" />
          <LabeledInput
            label={isMag ? 'Affiliation / Section' : 'Affiliation'}
            value={meta.affiliation}
            onChange={set('affiliation')}
            placeholder="School of Physics, USM"
          />
        </>
      )}

      {hasBar && (
        <>
          <p className="group-label">Top bar</p>
          <LabeledInput
            label="Top bar text"
            value={meta.masthead ?? ''}
            onChange={set('masthead')}
            placeholder="School of Physics"
          />
          {isP2 && (
            <LabeledInput
              label="Hero caption"
              value={meta.heroCaption ?? ''}
              onChange={set('heroCaption')}
              placeholder="Hero image caption"
            />
          )}
        </>
      )}

      {isMag && (
        <>
          <p className="group-label">Magazine elements</p>
          <LabeledInput label="Masthead" value={meta.masthead ?? ''} onChange={set('masthead')} placeholder="KUANTA" />
          <LabeledInput
            label="Volume / Date"
            value={meta.volume ?? ''}
            onChange={set('volume')}
            placeholder="VOL. IX · NO.2 · MARET 2026"
          />
          <LabeledInput
            label="Location (photo tag)"
            value={meta.location ?? ''}
            onChange={set('location')}
            placeholder="OBSERVATORIUM MAUNA · 4.200 MDPL"
          />
          <LabeledInput
            label="Photo credit"
            value={meta.photoCredit ?? ''}
            onChange={set('photoCredit')}
            placeholder="L. HAKIM"
          />
          <LabeledTextarea
            label="Pull-quote"
            value={meta.pullQuote ?? ''}
            onChange={set('pullQuote')}
            placeholder="Large quote shown across the spread…"
          />
          <LabeledInput
            label="Quote attribution"
            value={meta.pullQuoteBy ?? ''}
            onChange={set('pullQuoteBy')}
            placeholder="— DR. ARIA PRATAMA, FEB 2026"
          />
        </>
      )}
    </Section>
  );
}
