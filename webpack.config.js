//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');
/**@type {import('webpack').Configuration}*/

const config = {
  target: 'webworker',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    fs: 'commonjs fs',
    path: 'commonjs path',
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    alias: {
      'handlebars' : 'handlebars/dist/handlebars.js'
    }
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
        loader: 'ts-loader'
      }]
    }]
  }
};
module.exports = config;
