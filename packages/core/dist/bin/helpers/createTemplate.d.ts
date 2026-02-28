interface CreateTemplateOptions {
    apiType: 'full' | 'graphql' | 'rest';
    baseUrl: string;
    port: number;
    staticPath: string;
    withTypescript: boolean;
}
export declare const createTemplate: (options: CreateTemplateOptions) => void;
export {};
