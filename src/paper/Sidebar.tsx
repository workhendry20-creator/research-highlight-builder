import type { Doc } from '../schema/document';

export function Sidebar({ doc }: { doc: Doc }) {
  const highlights = doc.highlights.filter((h) => h.trim());

  return (
    <aside className="sidebar">
      <h3>Highlights</h3>
      <ul className="highlights">
        {highlights.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
      {doc.references.length > 0 && (
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
    </aside>
  );
}
