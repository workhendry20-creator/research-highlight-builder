import type { CSSProperties } from 'react';
import type { Doc } from '../schema/document';
import type { Pagination } from '../lib/paginate';
import { Flow } from './Flow';

interface Props {
  doc: Doc;
  vars: CSSProperties;
  pagination: Pagination;
}

export function Page2({ doc, vars, pagination }: Props) {
  return (
    <div className="page" style={vars}>
      <div className="body-cols body-cols--p2">
        <Flow pieces={pagination.page2} doc={doc} />
      </div>
      <div className="page2-footer">2</div>
    </div>
  );
}
