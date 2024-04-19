const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const ZipPlugin = require('zip-webpack-plugin');
const common = require('./webpack.common');
const manifest = require('./assets/manifest.json');

const commonProps = common('production');

module.exports = {
  ...commonProps,
  output: {
    ...commonProps.output,
    path: path.resolve(__dirname, 'publish'),
  },
  plugins: [
    ...commonProps.plugins,
    new ZipPlugin({
      path: '../zip',
      filename: `${manifest.version}.zip`,
      extension: 'zip',
      fileOptions: {
        compress: true,
        forceZip64Format: false,
      },
      zipOptions: {
        forceZip64Format: false,
      },
    }),
  ],
};
