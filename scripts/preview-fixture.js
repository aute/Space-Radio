const path = require('node:path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('../config/webpack.config')('development');

config.entry = './tests/browser/entry.jsx';
config.module.rules[0].include = [path.resolve('src'), path.resolve('tests/browser')];
config.devServer.port = 3100;
config.devServer.proxy = [];
const server = new WebpackDevServer(config.devServer, webpack(config));
server.start().then(() => console.log('Controlled test fixture: http://127.0.0.1:3100 (not live orbital data)'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.stop());
