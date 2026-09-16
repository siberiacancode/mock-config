import { SearchIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchInputProps {
  className?: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({
  label,
  placeholder,
  value,
  className,
  onChange
}: SearchInputProps) => (
  <label
    className={cn(
      'flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground-secondary focus-within:border-ring',
      className
    )}
  >
    <SearchIcon className='size-4 shrink-0' />
    <input
      aria-label={label}
      className='w-full bg-transparent text-foreground outline-hidden placeholder:text-foreground-secondary'
      placeholder={placeholder}
      type='text'
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);
