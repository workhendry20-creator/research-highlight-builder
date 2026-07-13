import { useEffect } from 'react';
import { useStore } from 'zustand';
import { useDoc } from '../store/useDoc';
import { migrate } from '../schema/document';

function pickFile(onPick: (file: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) onPick(f);
  };
  input.click();
}

const undo = () => useDoc.temporal.getState().undo();
const redo = () => useDoc.temporal.getState().redo();

function save() {
  const doc = useDoc.getState().doc;
  const name =
    (doc.meta.title.trim() || 'research-highlight')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'research-highlight';
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function open() {
  pickFile((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        useDoc.getState().load(migrate(JSON.parse(reader.result as string)));
      } catch {
        alert('File tidak valid atau versinya tidak didukung.');
      }
    };
    reader.readAsText(file);
  });
}

export function Toolbar() {
  const canUndo = useStore(useDoc.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useDoc.temporal, (s) => s.futureStates.length > 0);

  // Keyboard: ⌘/Ctrl+Z undo, +Shift redo (or ⌘Y), ⌘S save.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === 'y') {
        e.preventDefault();
        redo();
      } else if (k === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="toolbar">
      <span className="toolbar-brand">Research Highlight Builder</span>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button className="tool-btn" onClick={undo} disabled={!canUndo} title="Urungkan (⌘Z)">
          ↶ Undo
        </button>
        <button className="tool-btn" onClick={redo} disabled={!canRedo} title="Ulangi (⌘⇧Z)">
          ↷ Redo
        </button>
      </div>
      <div className="toolbar-group">
        <button className="tool-btn" onClick={open} title="Buka file .json">
          Buka…
        </button>
        <button className="tool-btn" onClick={save} title="Simpan sebagai .json (⌘S)">
          Simpan
        </button>
        <button className="tool-btn tool-btn--primary" onClick={() => window.print()} title="Export PDF (⌘P)">
          Export PDF
        </button>
      </div>
    </header>
  );
}
