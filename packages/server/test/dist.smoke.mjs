import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const packageDirectory = fileURLToPath(new URL('..', import.meta.url));
const cliPath = fileURLToPath(new URL('../dist/bin/bin.mjs', import.meta.url));

const getAvailablePort = async () => {
  const portFinder = createServer();
  portFinder.listen(0, '127.0.0.1');
  await once(portFinder, 'listening');

  const address = portFinder.address();
  assert.equal(typeof address, 'object');

  await new Promise((resolve) => portFinder.close(resolve));
  return address.port;
};

const stopCli = async (cliProcess) => {
  if (cliProcess.exitCode !== null || cliProcess.signalCode !== null) return;

  const exitPromise = once(cliProcess, 'exit');
  cliProcess.kill();
  await exitPromise;
};

const waitForServer = async (serverUrl, cliProcess, getOutput) => {
  const deadline = Date.now() + 10_000;
  let lastError;

  while (Date.now() < deadline) {
    if (cliProcess.exitCode !== null || cliProcess.signalCode !== null) {
      throw new Error(`CLI exited before the server started.\n${getOutput()}`);
    }

    try {
      return await fetch(`${serverUrl}/health`);
    } catch (error) {
      lastError = error;
      await delay(50);
    }
  }

  throw new Error(`CLI did not start within 10 seconds.\n${getOutput()}`, { cause: lastError });
};

test('built CLI starts a working server from a TypeScript config', async () => {
  const port = await getAvailablePort();
  const serverUrl = `http://127.0.0.1:${port}`;
  const cliProcess = spawn(
    process.execPath,
    [cliPath, '--config', 'test/fixtures/mock-server.config.ts', '--port', String(port)],
    {
      cwd: packageDirectory,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  let stderr = '';
  let stdout = '';
  cliProcess.stderr.on('data', (chunk) => (stderr += chunk));
  cliProcess.stdout.on('data', (chunk) => (stdout += chunk));

  try {
    const response = await waitForServer(
      serverUrl,
      cliProcess,
      () => `stdout:\n${stdout}\nstderr:\n${stderr}`
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await stopCli(cliProcess);
  }
});
