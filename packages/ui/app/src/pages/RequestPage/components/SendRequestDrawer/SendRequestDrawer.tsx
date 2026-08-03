import { PlayIcon, SquareIcon, XIcon } from 'lucide-react';

import type { Method } from '@/components';

import { Drawer, DrawerClose, DrawerContent, MethodBadge } from '@/components';

import type { RouteEntry } from '../../types';

import { buildRestPayload } from './adapter';
import { EventStreamView } from './components/EventStreamView/EventStreamView';
import { RequestForm } from './components/RequestForm/RequestForm';
import { ResponseView } from './components/ResponseView/ResponseView';
import { useRequestForm, useSendRequest } from './hooks';

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

  const stream = sendRequest.result?.stream;

  const onSend = () =>
    sendRequest.send(
      buildRestPayload({
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
            {stream?.isActive && (
              <button
                className='flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground hover:border-additional-fail/50 hover:text-additional-fail'
                type='button'
                onClick={sendRequest.stop}
              >
                <SquareIcon className='size-3.5' />
                Stop
              </button>
            )}
            {!stream?.isActive && (
              <button
                className='flex cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-default disabled:opacity-60'
                disabled={sendRequest.isLoading}
                type='button'
                onClick={onSend}
              >
                <PlayIcon className='size-3.5' />
                {sendRequest.isLoading ? 'Sending…' : 'Send'}
              </button>
            )}
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

            <RequestForm {...form} />
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

            {stream && <EventStreamView stream={stream} />}
            {sendRequest.result?.response && (
              <ResponseView response={sendRequest.result.response} />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
