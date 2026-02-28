import type { CheckActualValueCheckMode, CheckMode } from '../../../types';
interface ResolveEntityValuesParamsWithCheckActualValueCheckMode {
    actualValue: unknown;
    checkMode: CheckActualValueCheckMode;
}
interface ResolveEntityValuesParamsWithEnabledOneOf {
    actualValue: unknown;
    checkMode: Exclude<CheckMode, CheckActualValueCheckMode>;
    descriptorValue: unknown[];
    oneOf: true;
}
interface ResolveEntityValuesParamsWithDisabledOneOf {
    actualValue: unknown;
    checkMode: Exclude<CheckMode, CheckActualValueCheckMode>;
    descriptorValue: unknown;
    oneOf?: false;
}
type ResolveEntityValuesParams = ResolveEntityValuesParamsWithCheckActualValueCheckMode | ResolveEntityValuesParamsWithDisabledOneOf | ResolveEntityValuesParamsWithEnabledOneOf;
export declare const resolveEntityValues: (params: ResolveEntityValuesParams) => boolean;
export {};
