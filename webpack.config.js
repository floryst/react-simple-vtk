const path = require('path');
const vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

const paths = {
  entry: path.join(__dirname, 'src/index.js'),
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
      /* your custom rules here */
    ].concat(vtkRules),
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      paths.source,
    ],
  },
};
