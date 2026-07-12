import { ComponentCard, Typography } from '@/components';
import { useConfig } from '@/utils/context';

export const ComponentsPage = () => {
  const { components } = useConfig();

  const requestsCount = components.reduce(
    (count, component) => count + component.configs.length,
    0
  );

  return (
    <div className='flex flex-col gap-l'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline gap-3'>
          <Typography variant='h1'>Components</Typography>
          <Typography affects='body-regular' className='text-foreground-secondary'>
            {components.length} components · {requestsCount} requests
          </Typography>
        </div>
        <Typography className='text-foreground-secondary'>
          Logical groups of requests from your mock server config. Click a component to see its
          routes.
        </Typography>
      </div>

      <div className='grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4'>
        {components.map((component, index) => (
          <ComponentCard key={component.name ?? index} component={component} index={index} />
        ))}
      </div>
    </div>
  );
};
