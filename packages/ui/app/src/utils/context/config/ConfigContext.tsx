import React from 'react';

import type { useMockServerConfig } from '@/utils/hooks';

export type ConfigContextParams = ReturnType<typeof useMockServerConfig>;

export const ConfigContext = React.createContext<ConfigContextParams | null>(null);
