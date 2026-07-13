import { useEffect } from 'react';
import { useDoc } from './store/useDoc';
import { Panel } from './panel/Panel';
import { PaperPreview } from './paper/PaperPreview';
import { sampleDoc } from './sample';
import './styles/page.css';
import './styles/panel.css';

export default function App() {
  const load = useDoc((s) => s.load);

  // Seed a real highlight the first time, only when the doc is truly empty.
  useEffect(() => {
    const { doc } = useDoc.getState();
    const blank =
      !doc.meta.title && doc.blocks.every((b) => b.type !== 'paragraph' || !b.text.trim());
    if (blank) load(sampleDoc());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <Panel />
      <PaperPreview />
    </div>
  );
}
