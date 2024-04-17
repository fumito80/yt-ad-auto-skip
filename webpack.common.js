/* eslint-disable import/no-extraneous-dependencies */
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  entry: {
    script: './src/script.js',
  },
  output: {
    globalObject: 'self',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  target: ['web', 'es2021'],
  cache: true,
  watchOptions: {
    poll: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: '*.*', context: 'assets/' },
        // { from: '*.html', context: 'src/view/' },
        // { from: '*.png', context: 'src/images/' },
        // { from: '*.json', context: 'src/_locales/en/', to: '_locales/en' },
        // { from: '*.json', context: 'src/_locales/ja/', to: '_locales/ja' },
      ],
    }),
    new ESLintPlugin({
      extensions: ['.ts', '.js'],
      exclude: 'node_modules',
    }),
    new CleanWebpackPlugin(),
    // new WebpackNotifierPlugin({ alwaysNotify: true }),
  ],
};
