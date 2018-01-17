/**
 * Version: 0.2.1
 */
const path = require("path");
const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;

const pkg = require("./package.json");

/**
 * These config objects are extracted so they can be reused by the normal
 * pipeline and the vue-loader.
 */
const babelConfig = {
  loader: "babel-loader",
  options: {
    babelrc: false,
    presets: [["@babel/preset-env", { debug: false, useBuiltIns: "usage" }]]
    // plugins: ['@babel/transform-runtime']
  }
};
const cssLoaders = [
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
];

const plugins = [
  new CaseSensitivePathsPlugin(),
  new ExtractTextPlugin({ filename: "../css/[name].css" }),
  new webpack.EnvironmentPlugin({ NODE_ENV: "development" })
];

if (process.env.NODE_ENV == "production") {
  plugins.push(new UglifyJsPlugin({ sourceMap: true }));
}

if (process.env.WEBPACK_BUNDLE_ANALYZER) {
  plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
  context: path.resolve(`./wp-content/themes/${pkg.name}/src`),
  entry: {
    app: ["@babel/polyfill", "./js/index.js"],
    admin: "./js/admin.js"
  },

  output: {
    path: path.resolve(`./wp-content/themes/${pkg.name}/dist/js`),
    filename: "[name].js",
    publicPath: ""
  },

  devtool: "source-map",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: babelConfig
      },
      {
        test: /\.s?css/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: cssLoaders
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
            js: babelConfig,
            scss: ["vue-style-loader"].concat(cssLoaders)
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

  plugins: plugins,

  node: {
    dgram: "empty",
    fs: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty"
  },

  performance: {
    hints: false
  }
};
