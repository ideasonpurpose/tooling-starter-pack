/**
 * IOP Web Tooling Starter Pack
 * Version: 0.2.1
 */
const path = require("path");

const gulp = require("gulp");
const chalk = require("chalk");
const log = require("fancy-log");
const changed = require("gulp-changed");
const globby = require("globby");
const imagemin = require("gulp-imagemin");
const browserSync = require("browser-sync").create();
const sass = require("node-sass");
const autoprefixer = require("autoprefixer");
const browserslist = require("browserslist");
const postcss = require("gulp-postcss");
const webpack = require("webpack");
const zip = require("gulp-zip");
const replace = require("gulp-replace");
const filter = require("gulp-filter");
const through2 = require("through2");

const del = require("del");
const runSequence = require("run-sequence");
const once = require("lodash.once");

const pkg = require("./package.json");

const redRound = n => chalk.magenta(Math.round(n * 1000) / 1000 + "%");
const blQuery = browserslist.findConfig(__dirname).defaults.join(", ");
const blCoverage = browserslist.coverage(browserslist(blQuery));
const blCoverageUS = browserslist.coverage(browserslist(blQuery), "US");
const blCoverageReport = [
  `Browserlist query: '${chalk.cyan(blQuery)}'`,
  `    These browsers account for ${redRound(
    blCoverageUS
  )} of US users and ${redRound(blCoverage)} of global users.`
];

const DEVURL = `https://${pkg.name}.test`;

const THEME_DIR = `./wp-content/themes/${pkg.name}`;
const SRC_DIR = THEME_DIR + "/src";
const DIST_DIR = THEME_DIR + "/dist";
const BUILD_DIR = "./builds";
const SASS_SRC = [SRC_DIR + "/sass/*.scss", "!" + SRC_DIR + "/sass/_*.scss"];

const STATIC_ASSETS = [
  `${SRC_DIR}/**/*`,
  `!${SRC_DIR}/webpack.config.js`,
  `!${SRC_DIR}/{images,js,sass}`, // omit folders
  `!${SRC_DIR}/{images,js,sass}/**/*` // omit folder contents
];

gulp.task("default", ["build"]);
gulp.task("build", function(cb) {
  runSequence("clean", ["copy", "sass", "imagemin", "webpack"], "zip", cb);
});

gulp.task("clean", function() {
  return del([DIST_DIR, BUILD_DIR]);
});

gulp.task("copy", function() {
  return gulp
    .src(STATIC_ASSETS)
    .pipe(changed(DIST_DIR))
    .pipe(gulp.dest(DIST_DIR))
    .pipe(browserSync.stream());
});

gulp.task("sass", function() {
  const dev = { sourceComments: true, outputStyle: "expanded" };
  const prod = { outputStyle: "compressed" };
  const sassConfig = Object.assign(
    { includePaths: [`${SRC_DIR}/sass`, "node_modules"] },
    process.env.NODE_ENV == "production" ? prod : dev
  );
  const sassErrorHandler = err => {
    browserSync.sockets.emit("fullscreen:message", {
      title: `Sass Error: ${err.relativePath}:${err.line}:${err.column}`,
      body: err.message,
      timeout: 10000
    });
    log(chalk.red(err));
  };

  blCoverageReport.map(bl => log(bl));
  return gulp
    .src(SASS_SRC)
    .pipe(
      through2.obj(function(file, enc, cb) {
        const config = Object.assign(sassConfig, {
          data: file.contents.toString()
        });
        sass.render(config, (err, styles) => {
          if (err) {
            return sassErrorHandler(err);
          }
          log(
            `Sass: compiled ${chalk.cyan(file.relative)} in ${chalk.magenta(
              `${styles.stats.duration} ms`
            )}`
          );
          file.contents = new Buffer(
            styles.css
              .toString()
              .replace(
                /(\/\* line [^,]+, )stdin( \*\/)/g,
                `$1${path.relative(process.cwd(), file.path)}$2`
              )
          );
          this.push(file);
          cb();
        });
      })
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(DIST_DIR + "/css"))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

gulp.task("imagemin", function() {
  return gulp
    .src(`${SRC_DIR}/images/**/*`)
    .pipe(
      imagemin(
        [
          imagemin.gifsicle(),
          imagemin.jpegtran({ progressive: true }),
          imagemin.optipng({ optimizationLevel: 4 }),
          imagemin.svgo({
            js2svg: { pretty: true },
            floatPrecision: 3,
            plugins: [
              // {mergePaths: true},
              { cleanupIDs: false },
              { convertTransform: true },
              { removeTitle: true },
              { sortAttrs: true }
            ]
          })
        ],
        { verbose: false }
      )
    )
    .pipe(gulp.dest(`${DIST_DIR}/images`))
    .pipe(browserSync.stream());
});

gulp.task("zip", function() {
  const pkg = require("./package.json");
  const versionDir = `${pkg.name}-${pkg.version}`.replace(/[ .]/g, "_");
  const zipFile = `${versionDir}.zip`;
  const autoloadFilter = filter("**/composer/autoload*.php", { restore: true });

  return gulp
    .src([`${THEME_DIR}/**/*`, `!${SRC_DIR}`])
    .pipe(autoloadFilter)
    .pipe(
      replace(
        `wp-content/themes/${pkg.name}/`,
        `wp-content/themes/${versionDir}/`
      )
    )
    .pipe(autoloadFilter.restore)
    .pipe(zip(zipFile))
    .pipe(gulp.dest(BUILD_DIR))
    .on("data", function(data) {
      log(
        `Zipped build ${chalk.cyan(pkg.version)} to ${chalk.magenta(
          data.relative
        )}`
      );
    });
});

gulp.task("webpack", function(callback) {
  const isWatch = process.argv.indexOf("watch") > -1;
  const compiler = webpack(require("./webpack.config.js"));
  let cb = once(callback);

  if (isWatch) {
    compiler.watch({ aggregateTimeout: 300, poll: 500 }, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        return;
      }
      log(stats.toString({ colors: true }));

      cb();

      const assets = stats
        .toJson()
        .assets.map(c => c.name)
        .filter(c => c.slice(-4) !== ".map");
      browserSync.reload(assets);
    });
  } else {
    compiler.run(function(err, stats) {
      log(stats.toString({ colors: true }));
      callback();
    });
  }
});

gulp.task("watch", ["build"], function() {
  browserSync.init({
    files: `${THEME_DIR}/**/*.php`,
    logConnections: true,
    open: false,
    plugins: ["bs-fullscreen-message", "browsersync-mdns"],
    proxy: DEVURL,
    reloadDelay: 75,
    reloadDebounce: 300,
    rewriteRules: [
      {
        // Browsersync will grab a '...<' at the end of a kint-truncated url and escape it, breaking Kint's display
        // This pre-corrects that error by injecting a space before the tag. This is enough to fix kint's display
        // Almost certainly a Browsersync bug that I should go fix.
        match: /\.\.\.<div /g,
        replace: "... <div "
      }
    ],
    notify: {
      styles: {
        backgroundColor: "rgba(27, 32, 50, 0.5)",
        textShadow: "0 1px 2px #000"
      }
    }
  });
  gulp.watch(STATIC_ASSETS, ["copy"]);
  gulp.watch("sass/**/*.scss", { cwd: SRC_DIR }, ["sass"]);
  gulp.watch("images/**/*", { cwd: SRC_DIR }, ["imagemin"]);
});
