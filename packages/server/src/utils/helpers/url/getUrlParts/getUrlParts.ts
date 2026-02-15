import { removeLeadingAndTrailingSlashes } from '../removeLeadingAndTrailingSlashes/removeLeadingAndTrailingSlashes';

export const getUrlParts = (url: string) => removeLeadingAndTrailingSlashes(url).split('/');
