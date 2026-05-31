import { createRequire, Module } from 'node:module';
import path from 'node:path';

type CompilableModule = Module & {
  _compile: (sourceCode: string, filename: string) => void;
};

export const resolveExportsFromSourceCode = (sourceCode: string, configDirname: string) => {
  const filename = path.join(configDirname, 'mock-server.config.cjs');
  const requireFromConfig = createRequire(filename);
  const moduleInstance = new Module(filename) as CompilableModule;

  moduleInstance.filename = filename;
  moduleInstance.paths = requireFromConfig.resolve.paths('mock-server.config.cjs') ?? [];

  moduleInstance._compile(sourceCode, moduleInstance.filename);
  return moduleInstance.exports;
};
