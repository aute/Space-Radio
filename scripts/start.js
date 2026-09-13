process.env.NODE_ENV = "development";
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const createConfig = require("../config/webpack.config");
const { createRadioServer } = require("../server/server");

async function start() {
  const config = createConfig("development");
  const radio = createRadioServer();
  const devServer = new WebpackDevServer(config.devServer, webpack(config));
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    // Always close both listeners, including when one failed to start.
    await Promise.allSettled([devServer.stop(), radio.close()]);
  }
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, stop);
  try {
    await radio.listen(Number(process.env.API_PORT || 3001), "127.0.0.1");
    await devServer.start();
    console.log(`Space Radio: http://${config.devServer.host}:${config.devServer.port}`);
  } catch (error) {
    console.error(error);
    await stop();
    process.exitCode = 1;
  }
}
start().catch(error => { console.error(error); process.exitCode = 1; });
