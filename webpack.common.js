/* eslint-disable import/no-extraneous-dependencies */
const CopyPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (mode) => ({
  mode,
  entry: {
    script: './src/script.js',
    background: './src/background.js',
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
    ],
  },
  watchOptions: {
    poll: true,
  },
  plugins: [
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
  ],
});
