export const resolveExportsFromSourceCode = (sourceCode: string) => {
  // @ts-expect-error: module is constructed
  const moduleInstance = new module.constructor();

  moduleInstance._compile(sourceCode, '');
  return moduleInstance.exports;
};
