import { LOCAL_STORAGE_KEYS, SCHEME } from '@/utils/constants';

export const getDefaultScheme = () => {
  const scheme = localStorage.getItem(LOCAL_STORAGE_KEYS.SCHEME) as Scheme;
  return Object.values(SCHEME).includes(scheme) ? scheme : 'system';
};
