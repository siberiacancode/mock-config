export const parseQuery = (requestUrl: string) => {
  // ✅ important:
  // base URL is required to parse relative request URLs; localhost here is just a placeholder
  const url = new URL(requestUrl, 'http://localhost');
  const query: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const currentValue = query[key];

    if (query[key] === undefined) {
      query[key] = value;
      continue;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value);
      continue;
    }

    query[key] = [currentValue, value];
  }

  return query;
};
