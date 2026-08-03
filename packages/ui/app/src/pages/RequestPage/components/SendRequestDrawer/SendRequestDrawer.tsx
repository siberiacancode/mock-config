import { PlayIcon, TriangleAlertIcon, XIcon } from 'lucide-react';

import type { Method } from '@/components';

import { Drawer, DrawerClose, DrawerContent, MethodBadge, StatusBadge } from '@/components';
import { cn } from '@/lib/utils';

import type { RouteEntry } from '../../types';

import { buildRequestPayload, formatResponseBody } from './helpers';
import { useRequestForm } from './useRequestForm';
import { useSendRequest } from './useSendRequest';

interface SendRequestDrawerProps {
  componentBaseUrl?: string;
  method: Method;
  open: boolean;
  path: string;
  route?: RouteEntry;
  onOpenChange: (open: boolean) => void;
}

export const SendRequestDrawer = ({
  method,
  open,
  path,
  componentBaseUrl,
  route,
  onOpenChange
}: SendRequestDrawerProps) => {
  const form = useRequestForm(route, method);
  const sendRequest = useSendRequest();

  const onSend = () =>
    sendRequest.send(
      buildRequestPayload({
        entityRows: form.entityRows,
        method,
        path,
        body: form.body,
        componentBaseUrl
      })
    );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className='flex items-center gap-3 border-b border-border bg-background-secondary px-5 py-3'>
          <MethodBadge method={method} variant='active' />
          <span className='font-code text-[15px] font-semibold'>{path}</span>

          <div className='ml-auto flex items-center gap-2'>
            <button
              className='flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-default disabled:opacity-60'
              disabled={sendRequest.isLoading}
              type='button'
              onClick={onSend}
            >
              <PlayIcon className='size-3.5' />
              {sendRequest.isLoading ? 'Sending…' : 'Send'}
            </button>
            <DrawerClose className='flex size-8 cursor-pointer items-center justify-center rounded-md text-foreground-secondary hover:bg-card hover:text-foreground'>
              <XIcon className='size-4' />
            </DrawerClose>
          </div>
        </div>

        <div className='grid min-h-0 flex-1 grid-cols-2 divide-x divide-border'>
          <div className='flex flex-col gap-4 overflow-y-auto p-5'>
            <span className='font-code text-[11px] uppercase tracking-wider text-foreground-secondary'>
              Request
            </span>

            {!form.hasRequestData && (
              <span className='text-sm text-foreground-secondary'>
                Fallback route — the request is sent without matchers
              </span>
            )}

            {Boolean(form.warnings.length) && (
              <div className='flex flex-col gap-1.5 rounded-lg border border-additional-warning/40 bg-additional-warning/10 px-3.5 py-2.5'>
                <span className='flex items-center gap-1.5 text-xs font-medium text-additional-warning'>
                  <TriangleAlertIcon className='size-3.5 shrink-0' />
                  Some matchers are not satisfied — the request may fall through to another route
                </span>
                {form.warnings.map((warning) => (
                  <span key={warning} className='font-code text-[11px] text-foreground-secondary'>
                    {warning}
                  </span>
                ))}
              </div>
            )}

            {form.sections.map((section) => (
              <div
                key={section.title}
                className='overflow-hidden rounded-lg border border-border bg-card'
              >
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
                      {row.input ? (
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
                            onChange={(event) =>
                              form.setDraft(section.name, row.key, event.target.value)
                            }
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
                      ) : (
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
                              {row.warning
                                ? `not sent — ${row.warning}`
                                : `derived from ${row.comparator}`}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {form.body && (
              <div className='overflow-hidden rounded-lg border border-border bg-card'>
                <div className='border-b border-border/60 px-3 py-2 text-xs font-medium text-foreground'>
                  Body
                </div>
                <pre className='overflow-x-auto px-3 py-2 font-code text-xs leading-relaxed text-foreground'>
                  {form.body}
                </pre>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-4 overflow-y-auto p-5'>
            <span className='font-code text-[11px] uppercase tracking-wider text-foreground-secondary'>
              Response
            </span>

            {!sendRequest.result && (
              <div className='flex flex-1 flex-col items-center justify-center gap-3 text-foreground-secondary'>
                <PlayIcon className='size-10 opacity-40' />
                <span className='text-sm'>
                  {sendRequest.isLoading ? 'Sending…' : 'Send the request to resolve a mock route'}
                </span>
              </div>
            )}

            {sendRequest.result?.error && (
              <div className='rounded-lg border border-additional-fail/40 bg-additional-fail/10 px-3.5 py-2.5 font-code text-xs text-additional-fail'>
                {sendRequest.result.error}
              </div>
            )}

            {sendRequest.result?.response && (
              <>
                <div className='flex items-center gap-2.5'>
                  <StatusBadge className='text-xs' status={sendRequest.result.response.status}>
                    {sendRequest.result.response.status} {sendRequest.result.response.statusText}
                  </StatusBadge>
                  <span className='font-code text-xs text-foreground-secondary'>
                    {sendRequest.result.response.durationMs}ms
                  </span>
                </div>

                <pre className='overflow-x-auto rounded-lg border border-border bg-card px-3.5 py-3 font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
                  {formatResponseBody(sendRequest.result.response.body)}
                </pre>

                <details className='rounded-lg border border-border bg-card'>
                  <summary className='cursor-pointer px-3 py-2 text-xs font-medium text-foreground'>
                    Headers ({Object.keys(sendRequest.result.response.headers).length})
                  </summary>
                  <div className='border-t border-border/60'>
                    {Object.entries(sendRequest.result.response.headers).map(([key, value]) => (
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
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
