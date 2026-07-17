import { useEffect, useState } from 'react';
import { useDoc } from './store/useDoc';
import { hydrate, startAutosave } from './store/persist';
import { Toolbar } from './panel/Toolbar';
import { Panel } from './panel/Panel';
import { PaperPreview } from './paper/PaperPreview';
import { sampleDoc } from './sample';
import './styles/fonts.css';
import './styles/page.css';
import './styles/paper2.css';
import './styles/paper3.css';
import './styles/magazine.css';
import './styles/panel.css';

export default function App() {
  const [ready, setReady] = useState(false);

  // Restore the last session, then keep mirroring edits to IndexedDB. Seed a
  // real highlight only on a genuinely empty first run. The `ready` gate avoids
  // flashing the sample before a stored doc loads.
  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    (async () => {
      await hydrate();
      if (cancelled) return;
      // Seed the sample whenever the doc is blank — a genuinely empty first run,
      // or a previously-autosaved empty doc that hydrate() faithfully restored.
      // An empty canvas is never what you want to look at.
      const { doc, load } = useDoc.getState();
      const blank =
        !doc.meta.title && doc.blocks.every((b) => b.type !== 'paragraph' || !b.text.trim());
      if (blank) load(sampleDoc());
      stop = startAutosave();
      setReady(true);
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  if (!ready) return <div className="app" />;

  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <Panel />
        <PaperPreview />
      </div>
    </div>
  );
}
