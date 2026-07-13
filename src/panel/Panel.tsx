import { MetaSection } from './sections/MetaSection';
import { BodySection } from './sections/BodySection';
import { HighlightsSection } from './sections/HighlightsSection';
import { ReferencesSection } from './sections/ReferencesSection';

export function Panel() {
  return (
    <aside className="panel">
      <header className="panel-head">
        <h1 className="panel-title">Research Highlight</h1>
        <p className="panel-sub">USM School of Physics</p>
      </header>
      <MetaSection />
      <BodySection />
      <HighlightsSection />
      <ReferencesSection />
    </aside>
  );
}
