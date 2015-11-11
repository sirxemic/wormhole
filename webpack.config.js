var webpack = require("webpack");

module.exports = {
  entry: "./js/src/main.js",
  devtool: "source-map",
  output: {
    path: "./js",
    filename: "dist.js"
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ]
};
