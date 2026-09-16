import { TriangleAlertIcon } from 'lucide-react';

import type { useGraphqlDocument } from '../../hooks';

type GraphqlDocumentFormProps = NonNullable<ReturnType<typeof useGraphqlDocument>>;

const FIELD_CLASS =
  'min-h-24 w-full resize-y bg-transparent px-3 py-2 font-code text-xs leading-relaxed text-foreground outline-hidden placeholder:text-foreground-secondary';

export const GraphqlDocumentForm = ({
  document,
  setQuery,
  setVariables,
  warnings
}: GraphqlDocumentFormProps) => (
  <>
    {Boolean(warnings.length) && (
      <div className='flex flex-col gap-1.5 rounded-lg border border-additional-warning/40 bg-additional-warning/10 px-3.5 py-2.5'>
        <span className='flex items-center gap-1.5 text-xs font-medium text-additional-warning'>
          <TriangleAlertIcon className='size-3.5 shrink-0' />
          The document has to be fixed before the route can match
        </span>
        {warnings.map((warning) => (
          <span key={warning} className='font-code text-[11px] text-foreground-secondary'>
            {warning}
          </span>
        ))}
      </div>
    )}

    <div className='overflow-hidden rounded-lg border border-border bg-card'>
      <div className='border-b border-border/60 px-3 py-2 text-xs font-medium text-foreground'>
        Query
      </div>
      <textarea
        aria-label='GraphQL query'
        className={FIELD_CLASS}
        spellCheck={false}
        value={document.query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>

    <div className='overflow-hidden rounded-lg border border-border bg-card'>
      <div className='border-b border-border/60 px-3 py-2 text-xs font-medium text-foreground'>
        Variables
      </div>
      <textarea
        aria-label='GraphQL variables'
        className={FIELD_CLASS}
        placeholder='{}'
        spellCheck={false}
        value={document.variables}
        onChange={(event) => setVariables(event.target.value)}
      />
    </div>
  </>
);
