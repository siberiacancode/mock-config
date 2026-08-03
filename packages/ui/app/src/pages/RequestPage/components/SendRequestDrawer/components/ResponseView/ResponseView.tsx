import { StatusBadge } from '@/components';

import type { ProxyResponse } from '../../types';

import { formatResponseBody } from '../../helpers';

interface ResponseViewProps {
  response: ProxyResponse;
}

export const ResponseView = ({ response }: ResponseViewProps) => (
  <>
    <div className='flex items-center gap-2.5'>
      <StatusBadge className='text-xs' status={response.status}>
        {response.status} {response.statusText}
      </StatusBadge>
      <span className='font-code text-xs text-foreground-secondary'>{response.durationMs}ms</span>
    </div>

    <pre className='overflow-x-auto rounded-lg border border-border bg-card px-3.5 py-3 font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
      {formatResponseBody(response.body)}
    </pre>

    <details className='rounded-lg border border-border bg-card'>
      <summary className='cursor-pointer px-3 py-2 text-xs font-medium text-foreground'>
        Headers ({Object.keys(response.headers).length})
      </summary>
      <div className='border-t border-border/60'>
        {Object.entries(response.headers).map(([key, value]) => (
          <div
            key={key}
            className='grid grid-cols-[1fr_1.4fr] border-b border-border/60 px-3 py-1.5 font-code text-[11px] last:border-b-0'
          >
            <span className='text-foreground-secondary'>{key}</span>
            <span className='break-all text-foreground'>{value}</span>
          </div>
        ))}
      </div>
    </details>
  </>
);
