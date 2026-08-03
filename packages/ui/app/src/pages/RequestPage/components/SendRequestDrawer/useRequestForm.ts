import { useState } from 'react';

import type { Method } from '@/components';

import type { RouteEntry } from '../../types';

import {
  BODY_METHODS,
  getEntityRows,
  getRowId,
  MAPPED_ENTITIES,
  resolveBody,
  resolveRows
} from './helpers';

export const useRequestForm = (route: RouteEntry | undefined, method: Method) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const entities = route?.entities ?? {};

  const entityRows = Object.fromEntries(
    MAPPED_ENTITIES.map(({ name }) => [
      name,
      resolveRows(name, getEntityRows(entities[name]), drafts)
    ])
  );

  const resolvedBody = BODY_METHODS.includes(method)
    ? resolveBody(entities.body)
    : { body: undefined, warnings: [] };

  const sections = MAPPED_ENTITIES.map((entity) => ({
    name: entity.name,
    title: entity.title,
    rows: entityRows[entity.name]
  })).filter((section) => section.rows.length);

  const setDraft = (entity: string, key: string, value: string) =>
    setDrafts((previous) => ({ ...previous, [getRowId(entity, key)]: value }));

  return {
    body: resolvedBody.body,
    entityRows,
    hasRequestData: Boolean(sections.length || resolvedBody.body),
    sections,
    setDraft,
    warnings: [
      ...sections.flatMap((section) =>
        section.rows.flatMap((row) => (row.issue ? [row.issue] : []))
      ),
      ...resolvedBody.warnings
    ]
  };
};
