import type { ParsedUrlQuery } from 'node:querystring';

import { pluralize, singularize } from 'inflection';

export const embedItem = (database: Record<string, any[]>, item: any, related: string) => {
  const isSingular = singularize(related) === related;
  if (isSingular) {
    const relatedData = database[pluralize(related)];
    if (!relatedData) return item;

    const foreignKey = `${related}Id`;
    const relatedItem = relatedData.find((relatedItem) => relatedItem.id === item[foreignKey]);
    return { ...item, [related]: relatedItem, [foreignKey]: undefined };
  }

  const relatedData = database[related];
  if (!relatedData || !item[related]) return item;

  const relatedItems = item[related].map((relatedItemId: string) =>
    relatedData.find((relatedItem) => relatedItem.id === relatedItemId)
  );

  return { ...item, [related]: relatedItems };
};

export const embed = (database: Record<string, any[]>, item: any, related: ParsedUrlQuery) => {
  if (Array.isArray(item) && typeof related === 'string') {
    return item.map((item) => embedItem(database, item, related));
  }

  if (Array.isArray(item) && Array.isArray(related)) {
    return item.map((item) => {
      related.forEach((related) => {
        item = embedItem(database, item, related);
      });
      return item;
    });
  }

  if (typeof related === 'string') {
    return embedItem(database, item, related);
  }

  if (Array.isArray(related)) {
    related.forEach((related) => {
      item = embedItem(database, item, related);
    });
    return item;
  }

  throw new Error('embed technical error');
};
