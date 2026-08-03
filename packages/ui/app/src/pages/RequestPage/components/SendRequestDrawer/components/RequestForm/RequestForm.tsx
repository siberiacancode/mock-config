import { TriangleAlertIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { useRequestForm } from '../../hooks';

type RequestFormProps = ReturnType<typeof useRequestForm>;

export const RequestForm = ({
  body,
  hasRequestData,
  sections,
  setDraft,
  warnings
}: RequestFormProps) => (
  <>
    {!hasRequestData && (
      <span className='text-sm text-foreground-secondary'>
        Fallback route — the request is sent without matchers
      </span>
    )}

    {Boolean(warnings.length) && (
      <div className='flex flex-col gap-1.5 rounded-lg border border-additional-warning/40 bg-additional-warning/10 px-3.5 py-2.5'>
        <span className='flex items-center gap-1.5 text-xs font-medium text-additional-warning'>
          <TriangleAlertIcon className='size-3.5 shrink-0' />
          Some matchers are not satisfied — the request may fall through to another route
        </span>
        {warnings.map((warning) => (
          <span key={warning} className='font-code text-[11px] text-foreground-secondary'>
            {warning}
          </span>
        ))}
      </div>
    )}

    {sections.map((section) => (
      <div key={section.title} className='overflow-hidden rounded-lg border border-border bg-card'>
        <div className='border-b border-border/60 px-3 py-2 text-xs font-medium text-foreground'>
          {section.title}
        </div>
        {section.rows.map((row) => (
          <div
            key={row.key}
            className='grid grid-cols-[1fr_1.4fr] border-b border-border/60 last:border-b-0'
          >
            <span className='border-r border-border/60 px-3 py-2 font-code text-xs text-foreground-secondary'>
              {row.key}
            </span>
            <span className='flex flex-col gap-1 px-3 py-2'>
              {row.input && (
                <>
                  <input
                    className={cn(
                      'w-full rounded-md border border-border bg-background-secondary px-2 py-1 font-code text-xs text-foreground outline-hidden placeholder:text-foreground-secondary focus:border-ring',
                      row.invalid && 'border-additional-fail text-additional-fail'
                    )}
                    aria-label={`${section.title} ${row.key}`}
                    placeholder='enter a value'
                    type='text'
                    value={row.draft}
                    onChange={(event) => setDraft(section.name, row.key, event.target.value)}
                  />
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-code text-[10px]',
                      row.invalid ? 'text-additional-fail' : 'text-foreground-secondary'
                    )}
                  >
                    {row.invalid && <TriangleAlertIcon className='size-3 shrink-0' />}
                    {row.input.condition}
                  </span>
                  {row.comparator && (
                    <span className='font-code text-[10px] text-foreground-secondary'>
                      required by {row.comparator}
                    </span>
                  )}
                </>
              )}
              {!row.input && (
                <>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-code text-xs',
                      row.warning ? 'italic text-additional-warning' : 'text-foreground'
                    )}
                  >
                    {row.warning && <TriangleAlertIcon className='size-3 shrink-0' />}
                    {row.value}
                  </span>
                  {row.comparator && (
                    <span className='font-code text-[10px] text-foreground-secondary'>
                      {row.warning ? `not sent — ${row.warning}` : `derived from ${row.comparator}`}
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    ))}

    {body && (
      <div className='overflow-hidden rounded-lg border border-border bg-card'>
        <div className='border-b border-border/60 px-3 py-2 text-xs font-medium text-foreground'>
          Body
        </div>
        <pre className='overflow-x-auto px-3 py-2 font-code text-xs leading-relaxed text-foreground'>
          {body}
        </pre>
      </div>
    )}
  </>
);
