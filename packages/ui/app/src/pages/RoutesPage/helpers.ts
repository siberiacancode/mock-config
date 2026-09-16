import { getConfigLabel, getConfigMethod } from '@/utils/helpers';

export const getRouteGroups = (components: MockServerComponent[], query: string) =>
  components
    .map((component, componentIndex) => ({
      component,
      componentIndex,
      configs: component.configs
        .map((config, configIndex) => ({ config, configIndex }))
        .filter(({ config }) => {
          if (!query) return true;

          const haystack =
            `${component.name ?? ''} ${getConfigMethod(config)} ${getConfigLabel(config)}`.toLowerCase();
          return haystack.includes(query);
        })
    }))
    .filter((group) => group.configs.length > 0);
