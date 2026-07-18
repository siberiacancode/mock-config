export const createGenerator = <Params, Value, Return>(
  handler: (params: Params) => Generator<Value, Return, Params>
) => {
  let dynamicIterator: Generator<Value, Return, Params> | null = null;

  return (params: Params): Return | Value => {
    if (!dynamicIterator) {
      dynamicIterator = handler(params);
    }

    const iteration = dynamicIterator.next(params);

    if (iteration.done) {
      dynamicIterator = null;
    }

    return iteration.value;
  };
};
