import { useConfig } from '@/utils/context';

import { ComponentsList } from '../../components/ComponentsList/ComponentsList';

export const ComponentsPage = () => {
  const { components } = useConfig();

  return <ComponentsList components={components} />;
};
