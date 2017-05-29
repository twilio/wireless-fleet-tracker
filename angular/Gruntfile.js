module.exports = function(grunt) {
  var webpack = require("webpack");
  var webpackConfig = require("./webpack.config.js");

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    webpack: {
      options: webpackConfig,
      build: {
        plugins: webpackConfig.plugins.concat(
          new webpack.optimize.UglifyJsPlugin({
            test: /.min.js$/,
            mangle: {
              except: ["App", "app"]
            },
            sourceMap: true
          })
        )
      }
    },

    "webpack-dev-server": {
      options: {
        webpack: webpackConfig,
        publicPath: webpackConfig.output.publicPath,
        contentBase: "build/assets",
        proxy: {
            // redirect all API calls to deployed runtime functions
            "/**": {
              target: "https://dancing-owl-0368.twil.io", //"http://localhost:4232", //
              changeOrigin: true,
              secure: false
            }
        }
      },
      start: {
        keepalive: true,
        port: 23745,
        webpack: {
          devtool: "eval"
        },
      }
    },

    clean: {
      folder: [
        'build/assets'
      ]
    }
  });

  grunt.loadNpmTasks("grunt-webpack");

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask("build", ["webpack:build"]);

  grunt.registerTask("dev", ["build", "webpack-dev-server:start"]);

  grunt.registerTask('default', ['build']);
};
