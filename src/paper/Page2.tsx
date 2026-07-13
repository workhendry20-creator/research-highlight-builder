import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Pagination } from '../lib/paginate';
import { grid } from '../lib/geometry';
import { Sidebar } from './Sidebar';
import { Flow } from './Flow';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pagination: Pagination;
}

export function Page2({ doc, vars, pagination }: Props) {
  const { railEvery } = grid(doc.design);
  const body = (
    <div className="body-cols body-cols--p2">
      <Flow pieces={pagination.page2} doc={doc} />
    </div>
  );

  return (
    <div className="page" style={vars}>
      {railEvery ? (
        <div className="body-row">
          {body}
          <Sidebar doc={doc} />
        </div>
      ) : (
        body
      )}
      <div className="page2-footer">2</div>
    </div>
  );
}
