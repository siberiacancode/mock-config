import React from 'react';

export interface SchemeContextParams {
  resolvedScheme: ResolvedScheme;
  scheme: Scheme;
  toggleScheme: (newScheme: Scheme) => void;
}

export const SchemeContext = React.createContext<SchemeContextParams>({
  scheme: 'system',
  resolvedScheme: 'light',
  toggleScheme: () => {}
});
