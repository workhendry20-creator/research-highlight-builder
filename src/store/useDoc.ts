import { create } from 'zustand';
import { temporal } from 'zundo';
import { emptyDoc, type Doc } from '../schema/document';

interface State {
  doc: Doc;
  /** Mutate a draft. Keep every edit going through here. */
  update: (fn: (d: Doc) => void) => void;
  load: (doc: Doc) => void;
}

export const useDoc = create<State>()(
  temporal(
    (set) => ({
      doc: emptyDoc(),
      update: (fn) =>
        set((s) => {
          const next = structuredClone(s.doc);
          fn(next);
          return { doc: next };
        }),
      load: (doc) => set({ doc }),
    }),
    {
      // Don't push a history entry on every keystroke.
      handleSet: (handleSet) => {
        let t: ReturnType<typeof setTimeout>;
        return (...args: Parameters<typeof handleSet>) => {
          clearTimeout(t);
          t = setTimeout(() => handleSet(...args), 400);
        };
      },
      limit: 100,
    },
  ),
);

/** Undo/redo, essentially free. */
export const useHistory = () => useDoc.temporal.getState();