import { sleep } from '@/utils/helpers';

export const setDelay = async (delay: number) => {
  await sleep(delay === Infinity ? 99999999 : delay);
};
