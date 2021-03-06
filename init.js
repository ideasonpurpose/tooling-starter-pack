#!/usr/bin/env node

const fs = require("fs-extra");
const http = require("http");
const path = require("path");
const { exec, spawn } = require("child_process");
const ora = require("ora");
const sortPackageJson = require("sort-package-json");
const hasbin = require("hasbin");

const _ = require("lodash");

const inquirer = require("inquirer");
const slug = require("slug");

slug.defaults.mode = "rfc3986";
slug.charmap["."] = " ";

/**
 * Read theme directories
 */
fs.ensureDirSync("./site/wp-content/themes/");
const themes = fs
  .readdirSync("./site/wp-content/themes/")
  .filter(t => !t.match(/(^\.|php$)/))
  .reduce((prev, theme) => {
    const encUTF8 = { encoding: "utf-8" };
    try {
      // try to read style.css, will fail if non-existant
      // will also fail if the regex can't match a Theme Name
      prev.push({
        name: fs
          .readFileSync(`./site/wp-content/themes/${theme}/style.css`, encUTF8)
          .match(/Theme Name: (.*)/)[1]
          .trim(),
        value: `./site/wp-content/themes/${theme}`
      });
    } catch (err) {}
    return prev;
  }, []);

if (themes.length) themes.push(new inquirer.Separator("--- or ---"));
themes.push({ name: "Create a New Theme!!!", value: false });

inquirer
  .prompt([
    {
      type: "list",
      name: "theme",
      message: "Select the active theme",
      choices: themes,
      when: a => themes.length > 1
    },
    {
      type: "input",
      name: "newTheme",
      message: "Enter a directory name for the new theme:",
      filter: n => slug(n),
      when: a => !a.theme
    }
  ])
  .then(function(answers) {
    if (answers.newTheme) {
      fs.outputFileSync(
        `./site/wp-content/themes/${answers.newTheme}/style.css`,
        `/*\nTheme Name: ${answers.newTheme}\n*/\n`
      );
      answers.theme = `./site/wp-content/themes/${answers.newTheme}`;
    }
    copyFiles(answers.theme)
      .then(mkDirs)
      .then(npm)
      .then(composer)
      .then(installs);
  });

const copyFiles = function(dest) {
  const configFiles = [
    ".browserslistrc",
    ".csscomb.json",
    ".editorconfig",
    ".eslint.js",
    "gulpfile.js",
    "webpack.config.js"
  ];
  const copies = configFiles.map(cf => {
    return fs.copy(`${__dirname}/files/${cf}`, `./site/${cf}`);
  });

  return Promise.all(copies).then(() => dest);
};

const mkDirs = function(dest) {
  const src = `${__dirname}/files/src`;
  const ow = { overwrite: false };

  return Promise.all([
    fs.copy(`${src}/js/index.js`, `${dest}/src/js/index.js`, ow),
    fs.copy(`${src}/js/index.js`, `${dest}/src/js/admin.js`, ow),
    fs.copy(`${src}/sass/main.scss`, `${dest}/src/sass/main.scss`, ow),
    fs.copy(`${src}/sass/_colors.scss`, `${dest}/src/sass/_colors.scss`, ow),
    fs.copy(
      `${src}/sass/_bootstrap-custom.scss`,
      `${dest}/src/sass/_bootstrap-custom.scss`,
      ow
    ),
    fs.copy(
      `${src}/sass/_bootstrap-overrides.scss`,
      `${dest}/src/sass/_bootstrap-overrides.scss`,
      ow
    ),

    fs.ensureDir(`${dest}/src/images`),
    fs.ensureDir(`${dest}/dist`),
    fs.ensureDir(`${dest}/lib`),
    fs.ensureDir(`${dest}/acf-json`)
  ]).then(() => dest);
};

const npm = function(dest) {
  const mergePrompt = {
    type: "confirm",
    name: "merge",
    default: true,
    message: "Merge with existing package.json file?"
  };

  return (
    fs
      .readJson(`./site/package.json`)
      .then(pkg =>
        inquirer
          .prompt(mergePrompt)
          .then(answers => (answers.merge ? pkg : false))
      )
      .catch(err => new Object()) // send a new object to merge with
      /**
       * @param  {mixed} obj a populated or empty object (for merging) or false
       */
      .then(pkg => {
        return fs
          .readJson(`${__dirname}/files/package.json`)
          .then(template => {
            template.name = path.basename(dest);

            // manually pre-merge version_files
            pkg.version_files = _
              .union(_.flatten([pkg.version_files]), [
                path.relative("./site", dest) + "/style.css"
              ])
              .filter(n => n);
            // manually pre-merge devDependencies into pkg
            pkg.devDependencies = _.defaults(
              template.devDependencies,
              pkg.devDependencies
            );
            return _.defaultsDeep({}, pkg, template);
          })
          .then(pkg =>
            fs.writeJson("./site/package.json", sortPackageJson(pkg), {
              spaces: 2
            })
          );
      })
      .then(() => dest)
  );
};

const composer = function(dest) {
  const mergePrompt = {
    type: "confirm",
    name: "merge",
    default: true,
    message: "Merge with existing composer.json file?"
  };

  return (
    fs
      .readJson(`./site/composer.json`)
      .then(pkg =>
        inquirer
          .prompt(mergePrompt)
          .then(answers => (answers.merge ? pkg : false))
      )
      .catch(err => new Object()) // send a new object to merge with
      /**
       * @param  {mixed} obj a populated or empty object (for merging) or false
       */
      .then(pkg => {
        if (pkg) {
          return fs
            .readJson(`${__dirname}/files/composer.json`)
            .then(template => {
              const vendorDir = path.relative("./site", dest) + "/vendor";

              // Set correct path for PSR-4 autoloader
              _.set(
                template,
                ["autoload", "psr-4", "ideasonpurpose\\"],
                [path.relative("./site", `${dest}/lib`)]
              );

              // force new config["vendor-dir"]
              _.set(pkg, ["config", "vendor-dir"], vendorDir);

              // Add extra stuff for wp-bootstrap-navwalker
              _.set(
                pkg,
                [
                  "extra",
                  "installer-paths",
                  `${vendorDir}/wp-bootstrap-navwalker`
                ],
                ["wp-bootstrap/wp-bootstrap-navwalker"]
              );
              const nwf = [
                vendorDir +
                  "/wp-bootstrap-navwalker/class-wp-bootstrap-navwalker.php"
              ];

              const autoLoadFiles = _.get(pkg, ["autoload", "files"], nwf);

              if (Array.isArray(autoLoadFiles)) {
                _.set(pkg, ["autoload", "files"], _.union(autoLoadFiles, nwf));
              } else {
                _.set(pkg, ["autoload", "files"], _.uniq([autoLoadFiles, nwf]));
              }

              return _.defaultsDeep({}, pkg, template);
            })
            .then(pkg =>
              fs.writeJson("./site/composer.json", pkg, { spaces: 2 })
            );
        }
      })
      .then(() => dest)
  );
};

const useYarn = hasbin.sync("yarn");
const confirmNpm = {
  type: "confirm",
  name: "npm",
  default: true,
  message: "Install node.js dependencies with npm?"
};
const confirmYarn = {
  type: "confirm",
  name: "yarn",
  default: true,
  message: "Install node.js dependencies with Yarn?"
};
const confirmComposer = {
  type: "confirm",
  name: "composer",
  default: true,
  message: "Install PHP dependencies with Composer?"
};

const installs = () => {
  const installPrompt = [useYarn ? confirmYarn : confirmNpm, confirmComposer];

  const installs = inquirer
    .prompt(installPrompt)
    .then(answers => {
      if (answers.npm) {
        const spinner = ora("Running npm install...").start();
        spinner.color = "green";
        return execPromise("npm install")
          .then(() => {
            spinner.succeed("npm install complete!");
            return answers;
          })
          .catch(err => {
            spinner.fail("npm failed to install");
            console.log(err);

            return answers;
          });
      }
      return answers;
    })
    .catch(err => console.error(err))
    .then(answers => {
      if (answers.yarn) {
        const spinner = ora("Running Yarn install...").start();
        spinner.color = "green";
        return execPromise("yarn install")
          .then(() => {
            spinner.succeed("Yarn install complete!");
            return answers;
          })
          .catch(err => {
            spinner.fail("Yarn failed to install");
            console.log(err);

            return answers;
          });
      }
      return answers;
    })
    .catch(err => console.error(err))
    .then(answers => {
      if (answers.composer) {
        const spinner = ora("Running Composer install...").start();
        spinner.color = "blue";
        return execPromise("composer install")
          .then(() => {
            spinner.succeed("Composer install complete!");
            return answers;
          })
          .catch(err => {
            spinner.fail("Composer failed to install");
            console.log(err);
            return answers;
          });
      }
      return answers;
    })
    .catch(err => console.error(err));
};

const execPromise = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: "./site" }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};
