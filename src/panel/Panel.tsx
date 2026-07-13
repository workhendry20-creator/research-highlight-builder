import { MetaSection } from './sections/MetaSection';
import { HeroSection } from './sections/HeroSection';
import { BodySection } from './sections/BodySection';
import { HighlightsSection } from './sections/HighlightsSection';
import { ReferencesSection } from './sections/ReferencesSection';
import { DesignSection } from './sections/DesignSection';

export function Panel() {
  return (
    <aside className="panel">
      <header className="panel-head">
        <h1 className="panel-title">Research Highlight</h1>
        <p className="panel-sub">USM School of Physics</p>
      </header>
      <MetaSection />
      <HeroSection />
      <BodySection />
      <HighlightsSection />
      <ReferencesSection />
      <DesignSection />
    </aside>
  );
}
