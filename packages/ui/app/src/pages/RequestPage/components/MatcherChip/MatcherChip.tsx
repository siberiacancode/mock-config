import { useCopy } from '@siberiacancode/reactuse';
import { CheckIcon, CopyIcon } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components';

interface MatcherChipProps {
  label: string;
  value: string;
}

export const MatcherChip = ({ label, value }: MatcherChipProps) => {
  const { copied, copy } = useCopy();

  return (
    <Popover>
      <PopoverTrigger className='max-w-80 cursor-pointer truncate rounded-md border border-border bg-background-secondary px-2 py-0.5 font-code text-[11px] text-accent transition-colors hover:border-accent/50'>
        {label}
      </PopoverTrigger>
      <PopoverContent className='max-w-lg'>
        <div className='flex items-center justify-between gap-3 border-b border-border/60 px-3.5 py-2'>
          <span className='font-code text-[11px] text-foreground-secondary'>{label}</span>
          <button
            className='flex shrink-0 cursor-pointer items-center gap-1 text-[11px] text-foreground-secondary transition-colors hover:text-foreground'
            type='button'
            onClick={() => copy(value)}
          >
            {copied && <CheckIcon className='size-3 text-additional-success' />}
            {!copied && <CopyIcon className='size-3' />}
            {copied ? 'copied' : 'copy'}
          </button>
        </div>
        <pre className='max-h-72 overflow-auto px-3.5 py-3 font-code text-xs leading-relaxed text-foreground-secondary'>
          {value}
        </pre>
      </PopoverContent>
    </Popover>
  );
};
