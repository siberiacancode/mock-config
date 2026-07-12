import { Typography } from '@/components';
import { useConfig } from '@/utils/context';

export const SettingsPage = () => {
  const { settings } = useConfig();

  return (
    <div className='flex flex-col gap-l'>
      <Typography variant='h1'>Settings</Typography>
      <pre className='w-fit rounded-lg border border-border bg-card p-4 font-code text-[13px] text-foreground-secondary'>
        {JSON.stringify(settings, null, 2)}
      </pre>
    </div>
  );
};
