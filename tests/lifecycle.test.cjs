const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

async function reservePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

test('a frontend port conflict exits and releases the backend listener', { timeout: 15000 }, async t => {
  const occupied = await reservePort();
  const backend = await reservePort();
  const apiPort = backend.address().port;
  await new Promise(resolve => backend.close(resolve));
  t.after(() => occupied.close());
  const child = spawn(process.execPath, ['scripts/start.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(occupied.address().port), API_PORT: String(apiPort), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 1, output);
  assert.match(output, /EADDRINUSE/);
  const reclaimed = net.createServer();
  reclaimed.listen(apiPort, '127.0.0.1');
  await once(reclaimed, 'listening');
  await new Promise(resolve => reclaimed.close(resolve));
});
