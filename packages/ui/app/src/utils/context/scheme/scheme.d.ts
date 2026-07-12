type Scheme = 'dark' | 'light' | 'system';
type ResolvedScheme = Exclude<Scheme, 'system'>;
