import React from 'react';

import type { SchemeProviderProps } from '@/utils/context';

import { SchemeProvider } from '@/utils/context';

interface ProvidersProps {
  children: React.ReactNode;
  scheme: Omit<SchemeProviderProps, 'children'>;
}

export const Providers: React.FC<ProvidersProps> = ({ children, scheme }) => (
  <SchemeProvider {...scheme}>{children}</SchemeProvider>
);
