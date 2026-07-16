import { wrapSelection, TOKEN, type Mark } from './richtext';

/**
 * The paragraph textarea the user is (or was last) editing. The Word-style
 * B/I/U bar lives above the preview pane — far from the textarea — so it needs a
 * handle on the active editor to format its selection. A module singleton keeps
 * this out of React state: the bar buttons use onMouseDown to avoid stealing
 * focus, so the textarea stays selected while the marker is applied.
 */
interface ActiveEditor {
  el: HTMLTextAreaElement;
  setValue: (v: string) => void;
}

let active: ActiveEditor | null = null;

export function setActiveEditor(e: ActiveEditor): void {
  active = e;
}

/** Drop the reference only if the unmounting textarea is the tracked one. */
export function clearActiveEditor(el: HTMLTextAreaElement): void {
  if (active?.el === el) active = null;
}

/** Apply a mark to the active editor's selection. No-op if nothing is focused. */
export function applyMark(mark: Mark): void {
  if (!active) return;
  wrapSelection(active.el, TOKEN[mark], active.setValue);
}
