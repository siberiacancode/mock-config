import type { ParsedUrlQuery } from 'node:querystring';
export declare const pagination: (array: any[], queries: ParsedUrlQuery) => any[] | {
    _link: {
        count: number;
        pages: number;
        first: number;
        current: number;
        next: number | null;
        prev: number | null;
        last: number | null;
    };
    results: any[];
};
