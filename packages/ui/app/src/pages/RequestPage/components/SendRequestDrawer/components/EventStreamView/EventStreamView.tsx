import { LoaderCircleIcon } from 'lucide-react';

import { StatusBadge } from '@/components';

import type { StreamResult } from '../../types';

import { formatEventData } from '../../adapter';

const ROW_CLASS = 'grid grid-cols-[2rem_7rem_1fr_4rem] px-3';

interface EventStreamViewProps {
  stream: StreamResult;
}

export const EventStreamView = ({ stream }: EventStreamViewProps) => (
  <>
    <div className='flex items-center gap-2.5'>
      {stream.meta && (
        <StatusBadge className='text-xs' status={stream.meta.status}>
          {stream.meta.status} {stream.meta.statusText}
        </StatusBadge>
      )}
      <span className='font-code text-xs text-foreground-secondary'>
        {stream.meta?.durationMs ?? 0}ms to headers
      </span>
      {stream.isActive && (
        <span className='ml-auto flex items-center gap-1.5 font-code text-xs text-accent'>
          <LoaderCircleIcon className='size-3.5 animate-spin' />
          streaming
        </span>
      )}
      {!stream.isActive && (
        <span className='ml-auto font-code text-xs text-foreground-secondary'>
          {stream.events.length} {stream.events.length === 1 ? 'event' : 'events'} in{' '}
          {stream.totalMs ?? 0}ms
        </span>
      )}
    </div>

    {stream.error && (
      <div className='rounded-lg border border-additional-fail/40 bg-additional-fail/10 px-3.5 py-2.5 font-code text-xs text-additional-fail'>
        {stream.error}
      </div>
    )}

    <div className='overflow-hidden rounded-lg border border-border bg-card'>
      <div
        className={`${ROW_CLASS} border-b border-border/60 py-2 text-[11px] font-medium uppercase tracking-wider text-foreground-secondary`}
      >
        <span>#</span>
        <span>Event</span>
        <span>Data</span>
        <span className='text-right'>Time</span>
      </div>

      {!stream.events.length && (
        <div className='px-3 py-3 text-xs text-foreground-secondary'>
          Waiting for the first event…
        </div>
      )}

      {stream.events.map((streamEvent, eventIndex) => (
        <div
          key={`${streamEvent.id ?? ''}-${streamEvent.atMs}-${eventIndex}`}
          className={`${ROW_CLASS} border-b border-border/60 py-1.5 font-code text-[11px] last:border-b-0`}
        >
          <span className='text-foreground-secondary'>{eventIndex + 1}</span>
          <span className='truncate text-accent'>{streamEvent.event ?? 'message'}</span>
          <span className='break-all text-foreground'>{formatEventData(streamEvent.data)}</span>
          <span className='text-right text-foreground-secondary'>{streamEvent.atMs}ms</span>
        </div>
      ))}
    </div>
  </>
);
