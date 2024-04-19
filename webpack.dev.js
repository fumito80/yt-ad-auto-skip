const path = require('path');
const common = require('./webpack.common');

module.exports = {
  ...common('development'),
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
};
