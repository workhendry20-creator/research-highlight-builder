import type { CSSProperties } from 'react';
import type { Pagination } from '../lib/paginate';

interface Props {
  vars: CSSProperties;
  pagination: Pagination;
}

export function Page2({ vars, pagination }: Props) {
  return (
    <div className="page" style={vars}>
      <div className="body-cols body-cols--p2">
        {pagination.page2.map((p, i) => (
          <p key={i} className={p.cont ? 'cont' : undefined}>
            {p.text}
          </p>
        ))}
      </div>
      <div className="page2-footer">2</div>
    </div>
  );
}
