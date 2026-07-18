import { create } from 'zustand';

/**
 * Autosave health, kept in its own store so useDoc.ts stays untouched (house
 * rule). persist.ts writes it; the Toolbar reads it to show a save indicator.
 *
 *  - 'idle'   nothing written yet this session
 *  - 'saving' a debounced write is in flight
 *  - 'saved'  last write to IndexedDB succeeded
 *  - 'error'  last write rejected (quota, blocked DB) — edits may be lost
 */
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusStore {
  status: SaveState;
  setStatus: (status: SaveState) => void;
}

export const useSaveStatus = create<SaveStatusStore>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
