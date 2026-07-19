import type { Doc } from '../schema/document';

/** The highlights + references content, shared by the right rail (Sidebar) and
 *  the full-width end-of-article block (HighlightsBody in a .hl-below wrapper). */
export function HighlightsBody({ doc, hideRefs = false }: { doc: Doc; hideRefs?: boolean }) {
  const highlights = doc.highlights.filter((h) => h.trim());
  return (
    <>
      <h3>Highlights</h3>
      <ul className="highlights">
        {highlights.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      {!hideRefs && doc.references.length > 0 && (
        <>
          <h3>References</h3>
          <ol className="references">
            {doc.references.map((r) => (
              <li key={r.id}>
                {r.authors} ({r.year}). {r.title}. <em>{r.journal}</em>.
                {r.doi && <> doi:{r.doi}</>}
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}

export function Sidebar({ doc }: { doc: Doc }) {
  return (
    <aside className="sidebar">
      <HighlightsBody doc={doc} />
    </aside>
  );
}
