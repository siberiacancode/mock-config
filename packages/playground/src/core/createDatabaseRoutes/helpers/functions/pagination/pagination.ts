import type { ParsedUrlQuery } from 'node:querystring';

const DEFAULT_LIMIT = 10;

export const pagination = (array: any[], queries: ParsedUrlQuery) => {
  const { _page } = queries;
  if (!_page || +_page <= 0) return array;

  const page = +_page;
  const limit = queries._limit && +queries._limit > 0 ? +queries._limit : DEFAULT_LIMIT;
  const pages = Math.ceil(array.length / limit);
  if (page > pages) return array;

  const start = page * limit - limit;
  const end = page * limit;
  const results = array.slice(start, end);

  const next = page + 1 <= pages ? page + 1 : null;
  const prev = page - 1 !== 0 ? page - 1 : null;
  const last = pages > 0 ? pages : null;

  return {
    _link: {
      count: array.length,
      pages,
      first: 1,
      current: page,
      next,
      prev,
      last
    },
    results
  };
};
