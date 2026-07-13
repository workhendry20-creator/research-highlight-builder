import { useEffect, useState } from 'react';
import { useDoc } from './store/useDoc';
import { hydrate, startAutosave } from './store/persist';
import { Toolbar } from './panel/Toolbar';
import { Panel } from './panel/Panel';
import { PaperPreview } from './paper/PaperPreview';
import { sampleDoc } from './sample';
import './styles/page.css';
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
      const result = await hydrate();
      if (cancelled) return;
      if (result === 'empty') {
        const { doc, load } = useDoc.getState();
        const blank =
          !doc.meta.title && doc.blocks.every((b) => b.type !== 'paragraph' || !b.text.trim());
        if (blank) load(sampleDoc());
      }
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
