const path = require('path');
const vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

const paths = {
  entry: path.join(__dirname, 'src/mprpaint.js'),
  output: path.join(__dirname, 'dist'),
  source: path.join(__dirname, 'src'),
};

module.exports = {
  entry: {
    myApp: paths.entry,
  },
  output: {
    path: paths.output,
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    ].concat(vtkRules),
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      paths.source,
    ],
  },
};
