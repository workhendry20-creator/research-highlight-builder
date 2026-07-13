import { useState } from 'react';
import { useDoc } from '../store/useDoc';
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

  return (
    <aside className="panel">
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
