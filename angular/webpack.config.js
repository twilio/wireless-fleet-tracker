var path = require("path");
var webpack = require("webpack");
var config = require("./config"); // copy and modify config.example.js
var StringReplacePlugin = require("string-replace-webpack-plugin");

module.exports = {
  cache: true,
  entry: {
    "index": "./js/index.js",
    "index.min" : "./js/index.js"
  },
  output: {
    path: path.join(__dirname, "build", "assets"),
    publicPath: "/assets/",
    filename: "[name].js",
    chunkFilename: "[name]-[chunkhash].js"
  },
  module: {
    loaders: [
      // required to write "require('./style.css')"
      { test: /\.css$/,    loader: "style-loader!css-loader" },

      // required to write "require('./style.scss')"
      {
        test: /\.scss$/,   use: [{
            loader: "style-loader"
          }, {
            loader: "css-loader"
          }, {
            loader: "sass-loader",
            options: {
              includePaths :
                require('node-bourbon').includePaths
            }
          }]
      },

      // required for bootstrap icons
      { test: /\.woff$/,   loader: "url-loader?prefix=font/&limit=5000&mimetype=application/font-woff" },
      { test: /\.woff2$/,  loader: "url-loader?prefix=font/&limit=5000&mimetype=application/font-woff2" },
      { test: /\.ttf$/,    loader: "file-loader?prefix=font/" },
      { test: /\.eot$/,    loader: "file-loader?prefix=font/" },
      { test: /\.svg$/,    loader: "file-loader?prefix=font/" },

      // generate index.html
      { test: /\/index\.html$/, use: [{
          loader : "file-loader?name=index.html"
        }, {
          loader : StringReplacePlugin.replace({
            replacements: [
              {
                pattern: /<CONFIG_GOOGLE_MAP_API_KEY>/g,
                replacement: function () { return config.CONFIG_GOOGLE_MAP_API_KEY; }
              }
            ]
          })
        }]
      },

      { test: /views\/\w+\.html$/, loader: "ngtemplate-loader?relativeTo=" + __dirname + "/!html-loader" }
    ]
  },
    devtool: 'source-map',
  plugins: [
  ]
};
