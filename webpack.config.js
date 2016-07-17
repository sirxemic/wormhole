var webpack = require("webpack");

module.exports = {
  entry: "./src/main.js",
  output: {
    path: "./dist",
    filename: "dist.js"
  },
  module: {
    loaders: [
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl'
      }
    ]
  }
};
