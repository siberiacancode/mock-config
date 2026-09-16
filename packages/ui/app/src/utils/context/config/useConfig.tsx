import React from 'react';

import { ConfigContext } from './ConfigContext';

export const useConfig = () => {
  const config = React.use(ConfigContext);
  if (!config) throw new Error('useConfig must be used within a ConfigContext provider');
  return config;
};
