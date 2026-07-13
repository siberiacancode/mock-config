export const createGenerator = <
  Handler extends (params: never) => Generator<unknown, unknown, never>
>(
  handler: Handler
) => {
  type Params = Handler extends (params: infer P) => Generator<unknown, unknown, unknown>
    ? P
    : never;
  type Value = Handler extends (params: never) => Generator<infer V, unknown, never> ? V : never;

  let dynamicIterator: Generator<Value, Value | void, Params> | null = null;

  return (params: Params) => {
    if (!dynamicIterator) {
      dynamicIterator = handler(params as never) as Generator<Value, Value | void, Params>;
    }

    const iteration = dynamicIterator.next(params);

    if (iteration.done) {
      dynamicIterator = null;
    }

    return iteration.value as Value;
  };
};
