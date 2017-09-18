/**
 * Version: 0.1.1
 */
const path = require("path");
const readPkgUp = require("read-pkg-up");
const gulp = require("gulp");
const gutil = require("gulp-util");
const chalk = gutil.colors;
const changed = require("gulp-changed");
const globby = require("globby");
const findUp = require("find-up");
const sass = require("gulp-sass");
const imagemin = require("gulp-imagemin");
const browserSync = require("browser-sync").create();
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("autoprefixer");
const postcss = require("gulp-postcss");
const webpack = require("webpack");
const zip = require("gulp-zip");

const del = require("del");
const runSequence = require("run-sequence");

const pkg = require("./package.json");

const redRound = n => chalk.magenta(Math.round(n * 1000) / 1000 + "%");
const browserslist = require("browserslist");
const blQuery = browserslist.findConfig(__dirname).defaults.join(", ");
const blCoverage = browserslist.coverage(browserslist(blQuery));
const blCoverageUS = browserslist.coverage(browserslist(blQuery), "US");
const blCoverageReport = [
  `Browserlist query: '${chalk.cyan(blQuery)}'`,
  `    These browsers account for ${redRound(
    blCoverageUS
  )} of US users and ${redRound(blCoverage)} of global users.`
];

// TODO: This seems too fragile...
const DEVURL =
  "https://" +
  path.basename(path.dirname(findUp.sync("Vagrantfile")), ".dev") +
  ".dev";

// assume the first non-twenty* theme in wp-content/themes is our theme
// should pull this from package.json if possible or just put the gulpfile in there
// const THEME_DIR = globby
//   .sync(['./wp-content/themes/*/', '!./wp-content/themes/twenty*/'])[0]
//   .slice(0, -1);
const THEME_DIR = `./wp-content/themes/${pkg.wp_theme}`;
const SRC_DIR = THEME_DIR + "/src";
const DIST_DIR = THEME_DIR + "/dist";
const BUILD_DIR = "./builds";
const SCSS_SRC = [SRC_DIR + "/sass/*.scss", "!" + SRC_DIR + "/sass/_*.scss"];

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
  blCoverageReport.map(bl => gutil.log(bl));
  return gulp
    .src(SCSS_SRC)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        // sourceComments: true,
        // outputStyle: 'expanded',
        outputStyle: "compressed",
        includePaths: ["node_modules"]
      })
    )
    .on("error", function(err) {
      browserSync.sockets.emit("fullscreen:message", {
        title: `Sass Error: ${err.relativePath}:${err.line}:${err.column}`,
        body: err.message,
        timeout: 10000
      });
      sass.logError.bind(this)(err);
    })
    .on("data", function(data) {
      gutil.log("Sass: compiled", chalk.magenta(data.relative));
    })
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("./maps"))
    .pipe(gulp.dest(DIST_DIR + "/css"))
    .pipe(browserSync.stream({ match: "**/*.css" }));
});

gulp.task("imagemin", function() {
  return gulp
    .src(SRC_DIR + "/images/**/*")
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
    .pipe(gulp.dest(DIST_DIR + "/images"))
    .pipe(browserSync.stream());
});

gulp.task("zip", function() {
  const pkg = require("./package.json");
  const zipFile = (pkg.name + " " + pkg.version).replace(/[ .]/g, "_") + ".zip";

  return gulp
    .src([`${THEME_DIR}/**/*`, `!${SRC_DIR}`])
    .pipe(zip(zipFile))
    .pipe(gulp.dest(BUILD_DIR))
    .on("data", function(data) {
      gutil.log(
        `Zipped build ${chalk.cyan(pkg.version)} to ${chalk.magenta(
          data.relative
        )}`
      );
    });
});

gulp.task("webpack", function(callback) {
  const isWatch = process.argv.indexOf("watch") > -1;
  const compiler = webpack(require("./webpack.config.js"));
  if (isWatch) {
    compiler.watch(200, function(err, stats) {
      if (err) {
        gutil.log(err);
        return;
      }
      gutil.log(stats.toString({ colors: true }));
      if (stats.toJson().assets.length) {
        browserSync.reload(stats.toJson().assets[0].name);
      }
    });
    callback();
  } else {
    compiler.run(function(err, stats) {
      gutil.log(stats.toString({ colors: true }));
      callback();
    });
  }
});

gulp.task("watch", ["build"], function() {
  browserSync.init({
    files: THEME_DIR + "/**/*.php",
    logConnections: true,
    open: false,
    plugins: ["bs-fullscreen-message", "browsersync-mdns"],
    proxy: DEVURL,
    reloadDelay: 75,
    reloadDebounce: 300,
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
