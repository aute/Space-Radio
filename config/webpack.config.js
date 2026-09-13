const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const root = path.resolve(__dirname, '..');

module.exports = function createConfig(mode = 'development') {
  const production = mode === 'production';
  // Keep CRA's public environment convention without exposing server secrets.
  for (const file of [`.env.${mode}.local`, `.env.${mode}`, '.env.local', '.env']) {
    const filename = path.join(root, file);
    if (fs.existsSync(filename)) {
      require('dotenv-expand').expand(require('dotenv').config({ path: filename }));
    }
  }
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const env = { NODE_ENV: mode, PUBLIC_URL: publicUrl };
  for (const key of Object.keys(process.env).filter(key => /^REACT_APP_/i.test(key))) {
    env[key] = process.env[key];
  }

  return {
    mode,
    context: root,
    entry: './src/index.jsx',
    output: {
      path: path.join(root, 'build'),
      filename: 'static/js/[name].[contenthash:8].js',
      assetModuleFilename: 'static/media/[name].[contenthash:8][ext]',
      publicPath: publicUrl ? `${publicUrl}/` : (production ? './' : '/'),
      clean: true,
    },
    devtool: production ? 'source-map' : 'eval-cheap-module-source-map',
    resolve: { extensions: ['.js', '.jsx', '.json'] },
    module: {
      rules: [
        { test: /\.jsx?$/, include: path.join(root, 'src'), use: 'babel-loader' },
        {
          test: /\.css$/,
          use: [
            production ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                // CRA left root-relative public assets untouched in CSS.
                url: { filter: url => !url.startsWith('/') },
                // Existing components import a default object of CSS class names.
                modules: { auto: /\.module\.css$/, namedExport: false, exportLocalsConvention: 'as-is' },
              },
            },
            { loader: 'postcss-loader', options: { postcssOptions: { plugins: [['postcss-preset-env', { stage: 3 }]] } } },
          ],
        },
        { test: /\.(svg|png|jpe?g|gif|woff2?|ttf|mp3)$/, type: 'asset/resource' },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env': JSON.stringify(env) }),
      new HtmlWebpackPlugin({
        templateContent: () => fs.readFileSync(path.join(root, 'public/index.html'), 'utf8')
          .replace(/%PUBLIC_URL%/g, publicUrl || (production ? '.' : '')),
      }),
      new CopyPlugin({ patterns: [{ from: 'public', globOptions: { ignore: ['**/index.html'] } }] }),
      
      ...(production ? [new MiniCssExtractPlugin({ filename: 'static/css/[name].[contenthash:8].css' })] : []),
    ],
    optimization: { splitChunks: { chunks: 'all' } },
    devServer: {
      host: process.env.HOST || '127.0.0.1',
      port: Number(process.env.PORT || 3000),
      static: { directory: path.join(root, 'public') },
      historyApiFallback: true,
      hot: true,
      open: false,
      setupExitSignals: false,
      proxy: [{ pathFilter: ['/socket.io', '/api'], target: `http://127.0.0.1:${process.env.API_PORT || 3001}`, ws: true }],
    },
  };
};
