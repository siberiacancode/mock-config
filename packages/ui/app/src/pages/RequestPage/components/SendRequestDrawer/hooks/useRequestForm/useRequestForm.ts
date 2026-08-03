import { useState } from 'react';

import type { RouteEntry } from '../../../../types';
import type { SendTarget } from '../../types';

import {
  BODY_METHODS,
  getEntityRows,
  getRowId,
  GRAPHQL_ENTITIES,
  resolveBody,
  resolveRows,
  REST_ENTITIES
} from '../../helpers';

export const useRequestForm = (route: RouteEntry | undefined, target: SendTarget) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const entities = route?.entities ?? {};
  const mappedEntities = target.type === 'graphql' ? GRAPHQL_ENTITIES : REST_ENTITIES;

  const entityRows = Object.fromEntries(
    mappedEntities.map((entity) => [
      entity.name,
      resolveRows(entity.name, getEntityRows(entities[entity.name]), drafts)
    ])
  );

  const hasBody = target.type === 'rest' && BODY_METHODS.includes(target.method);
  const resolvedBody = hasBody ? resolveBody(entities.body) : { body: undefined, warnings: [] };

  const sections = mappedEntities
    .map((entity) => ({
      name: entity.name,
      title: entity.title,
      rows: entityRows[entity.name]
    }))
    .filter((section) => section.rows.length);

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
