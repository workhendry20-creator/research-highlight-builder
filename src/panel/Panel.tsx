import { useState } from 'react';
import { useDoc } from '../store/useDoc';
import { familyOf, type TemplateFamily } from '../schema/document';
import { TEMPLATE_META } from '../store/presets';
import { MetaSection } from './sections/MetaSection';
import { HeroSection } from './sections/HeroSection';
import { BodySection } from './sections/BodySection';
import { HighlightsSection } from './sections/HighlightsSection';
import { ReferencesSection } from './sections/ReferencesSection';
import { DesignSection } from './sections/DesignSection';

type TabId = 'content' | 'images' | 'highlights' | 'design';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'content', label: 'Content', icon: '📝' },
  { id: 'images', label: 'Images', icon: '🖼️' },
  { id: 'highlights', label: 'Highlights', icon: '⭐' },
  { id: 'design', label: 'Design', icon: '🎨' },
];

const SECTIONS: { family: TemplateFamily; label: string; icon: string; blurb: string }[] = [
  { family: 'paper', label: 'Paper', icon: '📄', blurb: 'Academic' },
  { family: 'magazine', label: 'Magazine', icon: '📰', blurb: 'Editorial' },
];

/**
 * Writing is the one dominant task, the rest is occasional setup — so the panel
 * shows one section at a time. Meta lives with Body under Content; figures stay
 * there too (they anchor to paragraphs). The A4 preview is a separate pane, so
 * switching tabs never hides the result.
 */
export function Panel() {
  const [tab, setTab] = useState<TabId>('content');
  const sidebarCount = useDoc(
    (s) => s.doc.highlights.filter((h) => h.trim()).length + s.doc.references.length,
  );
  const templateId = useDoc((s) => s.doc.templateId ?? 'paper-1');
  const switchTemplate = useDoc((s) => s.switchTemplate);

  // Which section is expanded. Defaults to the active template's family; clicking
  // a section header toggles it open/closed.
  const [openSection, setOpenSection] = useState<TemplateFamily | null>(familyOf(templateId));

  return (
    <aside className="panel">
      <div className="tpl-switch">
        <p className="tpl-switch-label">Pilih Template</p>
        {SECTIONS.map((s) => {
          const open = openSection === s.family;
          const items = TEMPLATE_META.filter((t) => t.family === s.family);
          const activeHere = familyOf(templateId) === s.family;
          return (
            <div key={s.family} className={`tpl-section${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className={`tpl-section-head${activeHere ? ' has-active' : ''}`}
                aria-expanded={open}
                onClick={() => setOpenSection(open ? null : s.family)}
              >
                <span className="tpl-section-ico" aria-hidden="true">
                  {s.icon}
                </span>
                <span className="tpl-section-name">{s.label}</span>
                <span className="tpl-section-blurb">{s.blurb}</span>
                <span className="tpl-section-chevron" aria-hidden="true">
                  {open ? '▾' : '▸'}
                </span>
              </button>
              {open && (
                <div className="tpl-list">
                  {items.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`tpl-btn${templateId === t.id ? ' is-active' : ''}`}
                      aria-pressed={templateId === t.id}
                      onClick={() => switchTemplate(t.id)}
                    >
                      <span className="tpl-btn-name">{t.name}</span>
                      <span className="tpl-btn-kind">{t.kind}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <header className="panel-head">
        <h1 className="panel-title">Research Highlight</h1>
        <p className="panel-sub">USM School of Physics</p>
      </header>

      <nav className="panel-tabs" role="tablist" aria-label="Bagian editor">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`panel-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="panel-tab-ico" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
            {t.id === 'highlights' && sidebarCount > 0 && <span className="badge">{sidebarCount}</span>}
          </button>
        ))}
      </nav>

      <div className="panel-scroll">
        {tab === 'content' && (
          <>
            <MetaSection />
            <BodySection />
          </>
        )}
        {tab === 'images' && <HeroSection />}
        {tab === 'highlights' && (
          <>
            <HighlightsSection />
            <ReferencesSection />
          </>
        )}
        {tab === 'design' && <DesignSection />}
      </div>
    </aside>
  );
}
