import type { ReactNode } from 'react';

interface LabeledProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function LabeledInput({ label, value, onChange, placeholder }: LabeledProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function LabeledTextarea({ label, value, onChange, placeholder }: LabeledProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea
        className="field-input field-textarea"
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** A titled group of controls. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

/** Small icon-ish button row used by list items (up / down / delete). */
export function RowButtons({
  onUp,
  onDown,
  onRemove,
  disableUp,
  disableDown,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  return (
    <div className="row-buttons">
      {onUp && (
        <button type="button" className="icon-btn" onClick={onUp} disabled={disableUp} title="Naik">
          ↑
        </button>
      )}
      {onDown && (
        <button
          type="button"
          className="icon-btn"
          onClick={onDown}
          disabled={disableDown}
          title="Turun"
        >
          ↓
        </button>
      )}
      <button type="button" className="icon-btn icon-btn--danger" onClick={onRemove} title="Hapus">
        ✕
      </button>
    </div>
  );
}
