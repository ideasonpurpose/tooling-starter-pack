/**
 * Version: 0.5.0
 */
const path = require("path");
const webpack = require("webpack");
// const webpack = require("webpack");
const autoprefixer = require("autoprefixer");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

// const BabelEnginePlugin = require("babel-engine-plugin");
const babelEnvDeps = require("webpack-babel-env-deps");

const pkg = require("./package.json");

// const browserslist = require("browserslist");
// const blQuery = browserslist.findConfig(__dirname).defaults.join(", ");

// console.log(blQuery);

// console.log(process.argv);
// console.log(process.env);
/**
 * These config objects are extracted so they can be reused by the normal
 * pipeline and the vue-loader.
 */
// const babelConfig = {
//   loader: "babel-loader",
//   options: {
//     // plugins: ["transform-es2015-arrow-functions"],
//     presets: [
//       [
//         // "env",
//         "@babel/preset-env",

//         {
//           // targets: { browsers: ["> 1%", "last 3 versions"] },
//           debug: true,
//           cacheDirectory: true

//         }
//       ]
//     ]
//   }
// };
// {
//   loader: "babel-loader",
//   options: {
//     babelrc: false,
//     presets: [["@babel/preset-env", { debug: true, useBuiltIns: "usage" }]]
//     // plugins: ['@babel/transform-runtime']
//   }
// };

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

// const plugins = [
//   new CaseSensitivePathsPlugin(),
//   new ExtractTextPlugin({ filename: "../css/[name].css" })
//   //   new webpack.EnvironmentPlugin({ NODE_ENV: "development" })
// ];

// if (process.env.NODE_ENV == "production") {
//   plugins.push(new UglifyJsPlugin({ sourceMap: true }));
// }

// console.log(babelEnvDeps.exclude())

const plugins = [
  new CaseSensitivePathsPlugin(),

  new UglifyJSPlugin(),
  // new ExtractTextPlugin("styles.css.[contentHash].css")
  new MiniCssExtractPlugin({ filename: "../css/[name].css" })
  // new BabelEnginePlugin({ presets: ["env"] }, {verbose:false}),
  // new WebpackMonitor({launch: true})

  // new webpack.optimize.CommonsChunkPlugin({
  //   name: "commons",
  //   // (the commons chunk name)

  //   filename: "commons.js"
  // })
];

if (process.env.WEBPACK_BUNDLE_ANALYZER) {
  const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
    .BundleAnalyzerPlugin;

  plugins.push(new BundleAnalyzerPlugin());
}

if (process.env.WEBPACK_MONITOR) {
  const WebpackMonitor = require("webpack-monitor");

  plugins.push(new WebpackMonitor({ launch: true }));
}

const babelOptions = {
  presets: [
    [
      "@babel/preset-env",
      {
        debug: false,
        // useBuiltIns: 'usage',
        useBuiltIns: "entry",
        modules: false
      }
    ]
  ],
  plugins: [
    require("@babel/plugin-syntax-dynamic-import"),
    // require("@babel/plugin-transform-runtime")
  ],

  cacheDirectory: true
};

const jsLoader = {
  test: /\.js$/,
  // exclude: /node_modules/,
  // exclude: '',
  exclude: babelEnvDeps.exclude(),
  // include: path.resolve(`./wp-content/themes/${pkg.name}/src`),
  // include: path.resolve('.'),
  // include: '.',

  loader: "babel-loader",

  options: babelOptions
};

const cssLoader = {
  test: /\.(scss|css)$/,
  use: [
    // fallback to style-loader in development
    process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
    "css-loader",
    "sass-loader"
]

  // use: ExtractTextPlugin.extract({
  //   use: [
  //     {
  //       loader: "css-loader",
  //       options: {
  //         sourceMap: true
  //       }
  //     },
  //     {
  //       loader: "sass-loader",
  //       options: {
  //         sourceMap: true
  //       }
  //     }
  //   ],
  //   fallback: "style-loader"
  // })
};

module.exports = {
  context: path.resolve(`./wp-content/themes/${pkg.name}/src`),
  entry: {
    app: ["./js/index.js"],
    admin: ["./js/admin.js"]
  },

  output: {
    path: path.resolve(`./wp-content/themes/${pkg.name}/dist/js`),
    filename: "[name].js",
    chunkFilename: "[name].bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
        options: {
          loaders: {
            js: [jsLoader],
            scss: ["vue-style-loader"].concat(cssLoaders)
          }
        }
      },
      cssLoader,
      jsLoader,
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

  optimization: {
    // namedModules: true,
    splitChunks: {
      // name: 'commons',
      // // chunks: "all"
      // minChunks: 2

      // splitChunks: {
      name: "vendor",
      chunks: "all"
      // },
    }
    //     noEmitOnErrors: true,
    // concatenateModules: true
  },
  //   node: {
  //     dgram: "empty",
  //     fs: "empty",
  //     net: "empty",
  //     tls: "empty",
  //     child_process: "empty"
  //   },

  performance: {
    hints: "warning"
  }
};
