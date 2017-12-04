/**
 * Version: 0.1.7
 */
const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const browserslist = require("browserslist");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");

const pkg = require("./package.json");

const blConfig = {
  targets: { browsers: browserslist.findConfig(__dirname).defaults }
};

module.exports = {
  context: path.resolve(`./wp-content/themes/${pkg.name}/src`),
  entry: {
    app: "./js/index.js",
    admin: "./js/admin.js"
  },

  output: {
    path: path.resolve(`./wp-content/themes/${pkg.name}/dist/js`),
    filename: "[name].js",
    publicPath: ""
  },

  devtool: "source-map",

  stats: "normal",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["env", blConfig]]
          }
        }
      },
      {
        test: /\.s?css/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                plugins: function() {
                  return [autoprefixer()];
                }
              }
            },
            "sass-loader"
          ]
        })
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "../images/[name]-[hash:6].[ext]"
            }
          },
          "image-webpack-loader"
        ]
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          loaders: {
            scss: [
              "vue-style-loader",
              "css-loader",
              {
                loader: "postcss-loader",
                options: {
                  plugins: function() {
                    return [autoprefixer()];
                  }
                }
              },
              "sass-loader"
            ]
          }
        }
      }
    ]
  },

  resolve: {
    extensions: [".js", ".vue", ".json"],
    alias: {
      vue$: "vue/dist/vue.esm.js"
    }
  },

  plugins: [
    new CaseSensitivePathsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      minimize: false,
      compress: {
        screw_ie8: true, // React doesn't support IE8
        warnings: false
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: false,
        screw_ie8: true
      }
    }),
    new ExtractTextPlugin({ filename: "../css/[name].css" })
  ],

  node: {
    fs: "empty",
    net: "empty",
    tls: "empty"
  }
};
