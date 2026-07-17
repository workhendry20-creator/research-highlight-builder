import type { Doc } from '../schema/document';

/** The rule with a tag block, shared by the paper templates that draw one.
 *  `flip` mirrors it for a verso page: the square and tag sit at the right. */
export function TagBar({ doc, flip = false }: { doc: Doc; flip?: boolean }) {
  return (
    <div className={`tag-bar${flip ? ' tag-bar--flip' : ''}`}>
      <span className="tag-bar-mark" />
      {/* Hugs its text: a longer tag simply lengthens the block and eats into
          the rule beside it. */}
      {doc.meta.masthead && <span className="tag-bar-tag">{doc.meta.masthead}</span>}
      <span className="tag-bar-fill" />
    </div>
  );
}
