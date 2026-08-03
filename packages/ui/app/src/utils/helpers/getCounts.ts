export const getRequestsCount = (components: MockServerComponent[]) =>
  components.reduce((count, component) => count + component.configs.length, 0);

export const getRoutesCount = (components: MockServerComponent[]) =>
  components.reduce(
    (count, component) =>
      count +
      component.configs.reduce((configCount, config) => configCount + config.routes.length, 0),
    0
  );
