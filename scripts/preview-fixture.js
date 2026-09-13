const path = require('node:path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('../config/webpack.config')('development');

const issPreview = process.argv.includes('--iss');
const audioPreview = process.argv.includes('--audio');
const skyPreview = process.argv.includes('--sky');
config.entry = issPreview ? './tests/browser/iss.jsx' : audioPreview ? './tests/browser/audio.jsx' : skyPreview ? './tests/browser/sky.jsx' : './tests/browser/entry.jsx';
config.module.rules[0].include = [path.resolve('src'), path.resolve('tests/browser')];
config.devServer.port = issPreview ? 3103 : audioPreview ? 3102 : 3100;
config.devServer.proxy = [];
const server = new WebpackDevServer(config.devServer, webpack(config));
server.start().then(() => console.log(issPreview ? 'ISS light preview: http://127.0.0.1:3103' : audioPreview ? 'Radio audio preview: http://127.0.0.1:3102' : skyPreview
  ? 'Clear-sky day preview: http://127.0.0.1:3100'
  : 'Controlled test fixture: http://127.0.0.1:3100 (not live orbital data)'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.stop());
