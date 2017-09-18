/**
 * Version: 0.1.5
 */
const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const browserslist = require("browserslist");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");

const pkg = require("./package.json");

blConfig = {
  targets: { browsers: browserslist.findConfig(__dirname).defaults }
};

module.exports = {
  context: path.resolve(`./wp-content/themes/${pkg.wp_theme}/src`), //__dirname,
  entry: {
    app: './js/index.js',
    admin: './js/admin.js'
  },

  output: {
    path: path.resolve(`./wp-content/themes/${pkg.wp_theme}/dist/js`), //path.resolve(__dirname, "../dist/js/"),
    filename: "[name].js",
    publicPath: ""
  },

  devtool: "source-map",

  stats: {
    color: true,
    version: true
  },

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
            // scss: 'vue-style-loader!css-loader!sass-loader'
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
    // new FriendlyErrorsWebpackPlugin(),
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
    new ExtractTextPlugin({ filename: "../css/[name].css" }),
    // new webpack.DefinePlugin({
    //   "process.env": {
    //     NODE_ENV: '"production"'
    //   }
    // })
  ],

  node: {
    fs: "empty",
    net: "empty",
    tls: "empty"
  }
};
