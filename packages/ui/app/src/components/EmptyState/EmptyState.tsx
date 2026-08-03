import { Typography } from '../Typography/Typography';

interface EmptyStateProps {
  description?: string;
  title: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className='flex h-full flex-col items-center justify-center gap-1 text-center'>
    <Typography variant='h1'>{title}</Typography>
    {description && <Typography className='text-foreground-secondary'>{description}</Typography>}
  </div>
);
