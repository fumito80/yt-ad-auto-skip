/* eslint-disable import/no-extraneous-dependencies */
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = (mode) => ({
  mode,
  entry: {
    script: './src/script.js',
    background: './src/background.js',
    popup: './src/popup.js',
    prescript: './src/prescript.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  target: ['web', 'es2021'],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'ifdef-loader', options: { mode } },
        ],
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },
  watchOptions: {
    poll: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        { from: '*.*', context: 'assets/' },
      ],
    }),
    new ESLintPlugin({
      extensions: ['.js'],
      exclude: 'node_modules',
    }),
    new CleanWebpackPlugin(),
    new WebpackNotifierPlugin({ alwaysNotify: true }),
  ],
});
